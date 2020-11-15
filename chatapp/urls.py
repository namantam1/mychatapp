# chat/urls.py
from django.urls import path
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView, LogoutView
from . import views

urlpatterns = [
    path('login/', LoginView.as_view(template_name='admin/login.html', redirect_authenticated_user=True), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('', login_required(views.index), name='index'),
    path('doubt/', login_required(views.DoubtView.as_view()), name='doubt'),
    path('room/', login_required(views.RoomView.as_view()), name='room'),
    path('doubtPost/', login_required(views.save_doubt), name='doubt_save'),
    # path('<str:room_name>/', login_required(views.room), name='room'),
]