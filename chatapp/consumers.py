# chat/consumers.py
import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer

from django.db.models import Q

from datetime import datetime

from .serializer import DoubtSerializer, UserSerializer
from .models import Profile, Doubt, Room

class ChatConsumer(WebsocketConsumer):
    def get_room_group_name(self, id):
        return "chat_%s" % id

    def connect(self):
        self.user = self.scope['user']
        self.room_ids = [room.id for room in self.user.room_student.all().union(self.user.room_teacher.all())]
        # self.room_name = self.scope['url_route']['kwargs']['room_name']
        # self.room_group_name = 'chat_%s' % self.room_name

        # Join room group
        print(self.room_ids)
        for room in self.room_ids:
            async_to_sync(self.channel_layer.group_add)(
                self.get_room_group_name(room),
                self.channel_name
            )

        self.accept()
        self.update_status(online=True)

    def disconnect(self, close_code):
        # Leave room group
        print(self.room_ids)
        for room in self.room_ids:
            async_to_sync(self.channel_layer.group_discard)(
                self.get_room_group_name(room),
                self.channel_name
            )
        self.update_status(online=False)

    def update_status(self, online=False):
        profile = Profile.objects.get(user=self.user)
        if online:
            profile.online = True
        else:
            profile.online = False
            profile.last_seen = datetime.now()
        profile.save()
        user = UserSerializer(instance=self.user).data
        for room in self.room_ids:
            async_to_sync(self.channel_layer.group_send)(
                self.get_room_group_name(room),
                {
                    "type": "status_upadate_send",
                    "message": {
                        'id': room,
                        "user": {
                            "id": self.user.id,
                            "online": online,
                            "lastSeen": " at " + str(datetime.now().strftime("%I:%M %p"))
                        }
                    }
                }
            )
            print(room, online, "** status send **")

    def update_seen_status(self, message):
        room_id = message.get('roomId')
        room = Room.objects.filter(Q(student=self.user)|Q(teacher=self.user), id=room_id)
        k = Doubt.objects.filter(~Q(user=self.user), room__in=room, seen=False).update(seen=True)
        # print(k)
        if k:
           # Send message to room group
            async_to_sync(self.channel_layer.group_send)(
                self.get_room_group_name(room_id),
                {
                    "type": "send_status_seen",
                    "message": {
                        'roomId': room_id
                    }
                }
            ) 


    def message_receive(self, message):
        serializer = DoubtSerializer(data=message)
        if serializer.is_valid():
            serializer.save(user=self.user)

            # Send message to room group
            async_to_sync(self.channel_layer.group_send)(
                self.get_room_group_name(serializer.data['roomId']),
                {
                    "type": "chat_message",
                    "message":serializer.data
                }
            )

    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        # message = text_data_json['text']
        print(text_data)
        if(text_data_json.get('type') == 'message'):
            self.message_receive(text_data_json)
        elif(text_data_json.get('type') == 'seenStatus'):
            self.update_seen_status(text_data_json)
        

    # Receive message from room group
    def chat_message(self, event):
        # print(event)
        message = event['message']
        data = {
            'type': 'message',
            'message': message
        }
        print(data, "## messafe ##")

        # Send message to WebSocket
        self.send(text_data=json.dumps(data))

    def status_upadate_send(self, event):
        message = event['message']
        data = {
            'type': 'status',
            'message': message
        }
        print(data, "## status update ##")
        self.send(text_data=json.dumps(data))

    def send_status_seen(self, event):
        message = event['message']
        data = {
            'type': 'seenStatus',
            'message': message
        }
        print(data, "#$# status seen update #$#")
        self.send(text_data=json.dumps(data))