from django.apps import AppConfig


class ChatappConfig(AppConfig):
    name = 'chatapp'

    def ready(self):
        from chatapp import sinals
