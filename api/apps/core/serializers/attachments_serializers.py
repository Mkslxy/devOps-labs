from rest_framework import serializers


class BaseFileSerializer(serializers.ModelSerializer):
    class Meta:
        abstract = True
        fields = ['id', 'file', 'name']


class BaseLinkSerializers(serializers.ModelSerializer):
    class Meta:
        abstract = True
        fields = ['id', 'url', 'name', 'is_video_embed']
