# chat/views.py
from django.shortcuts import render
from django.db.models import Q

from .serializer import DoubtSerializer, RoomSerializer
from .models import Doubt, Room

from rest_framework.response import Response
from rest_framework.generics import ListAPIView
from rest_framework.decorators import api_view

import json

def index(request):
    room = Room.objects.filter(Q(student=request.user) | Q(teacher=request.user))
    data = dict(
        rooms = room,
    )
    return render(request, 'react.html', context=data)

def room(request, room_name):
    return render(request, 'chat/room.html', {
        'room_name': room_name
    })

class DoubtView(ListAPIView):
    queryset = Doubt.objects.all()
    serializer_class = DoubtSerializer

    # def get_queryset(self):
    #     user = self.request.user
    #     return Doubt.objects.filter(user=user)
    
    

class RoomView(ListAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    # paginate_by = 10
    def get_queryset(self):
        user = self.request.user
        return Room.objects.filter(Q(student=user) | Q(teacher=user))

@api_view(['GET', 'POST'])
def save_doubt(request):
    if request.method == "POST":
        serializer = DoubtSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save(user=request.user)
            return Response(serializer.data)
    return Response({})