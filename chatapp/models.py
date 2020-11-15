from django.db import models
from datetime import datetime
from django.contrib.auth import get_user_model

MyUser = get_user_model()

# Create your models here.
ROOM_STATUS = [
    ('active', 'active'),
    ('engaged', 'engaged'),
    ('closed', 'closed'),
]
KLASS = [
    ('1', '8th'),
    ('2', '9th'),
    ('3', '10th'),
]

ROLE = [
    ('student', 'student'),
    ('teacher', 'teacher'),
]

class Profile(models.Model):
    user = models.OneToOneField(MyUser, on_delete=models.CASCADE)
    image = models.URLField(default="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_01.jpg")
    role = models.CharField(choices=ROLE, max_length=15, default='student')
    online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True)

    def __str__(self):
        return f"{self.user} - {self.role}"
    


class Room(models.Model):
    """
    sub,class,status,board,created_on,
    status(active,engaged,closed)
    """
    studentclass = models.CharField(max_length=255, choices=KLASS)
    student = models.ForeignKey(
        MyUser, related_name="room_student", on_delete=models.CASCADE, null=True)
    teacher = models.ForeignKey(
        MyUser, related_name="room_teacher", on_delete=models.CASCADE, null=True, blank=True)
    status = models.CharField(
        choices=ROOM_STATUS, default='active', max_length=225)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        text = (self.doubt_set.first().text or self.id) if self.doubt_set.first() else self.id
        return f"{text}"


def user_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
    now = datetime.now()
    data = {
        'year': now.year,
        'month': now.strftime('%B'),
        'room': instance.room.id,
        'file': filename,
    }
    return 'doubt/{year}/{month}/{room}_{file}'.format(**data)


class Doubt(models.Model):
    """
    timestamp,sid,roomid,media,dis,type,
    """
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True, blank=True)
    modified_on = models.DateTimeField(auto_now_add=True, blank=True)
    media = models.ImageField(upload_to=user_directory_path, blank=True, null=True)
    text = models.TextField(null=True)
    seen = models.BooleanField(default=False, blank=True)

    def __str__(self):
        return f"{self.text or self.id}"