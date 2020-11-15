from rest_framework import serializers

from .models import Doubt, Room

from django.contrib.auth import get_user_model
from django.utils.timesince import timesince
from django.utils.timezone import localtime
from django.db.models import Q

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField('get_image')
    lastSeen = serializers.SerializerMethodField("get_last_seen")
    online = serializers.SerializerMethodField()
    def get_online(self, obj):
        return obj.profile.online

    def get_last_seen(self, obj):
        time = localtime(obj.profile.last_seen or obj.last_login)
        return "at {}".format(time.strftime("%I:%M %p"))

    def get_image(self, obj):
        return obj.profile.image

    class Meta:
        model = User
        fields = ['id' ,'email', 'image', 'lastSeen', 'online']

class DoubtSerializer(serializers.ModelSerializer):
    # user = UserSerializer(required=False)
    doubtId = serializers.IntegerField(source='id', required=False)
    roomId = serializers.PrimaryKeyRelatedField(queryset=Room.objects.all(), source='room')
    timestamp = serializers.DateTimeField(format="%I:%M %p", required=False)

    def create(self, validated_data):
        return Doubt.objects.create(**validated_data)

    class Meta:
        model = Doubt
        fields = ['roomId', 'doubtId', 'user', 'timestamp', 'text', 'seen', 'media']
        read_only_fields = ['doubtId', 'timestamp', 'user']

class RoomSerializer(serializers.ModelSerializer):
    student = UserSerializer()
    teacher = UserSerializer()
    # doubt = DoubtSerializer(source='doubt_set', many=True)
    doubt = serializers.SerializerMethodField()
    timestamp = serializers.SerializerMethodField('get_timestamp')
    unseenCount = serializers.SerializerMethodField()

    def get_timestamp(self, obj):
        return timesince(obj.timestamp).split(',')[0] + " ago"

    def get_unseenCount(self, obj):
        return obj.doubt_set.filter(~Q(user=self.context['request'].user), seen=False).count()

    def get_doubt(self, obj):
        return DoubtSerializer(reversed(obj.doubt_set.order_by('id').reverse()), many=True).data

    class Meta:
        model = Room
        fields = ['id', 'student', 'teacher', 'studentclass', 'timestamp', 'doubt', 'unseenCount']
