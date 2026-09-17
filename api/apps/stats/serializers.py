from rest_framework import serializers


class TestMetricsSerializer(serializers.Serializer):
    taken = serializers.IntegerField()
    completed = serializers.IntegerField()
    passed = serializers.IntegerField()
    avg_percent = serializers.FloatField()
    trend = serializers.CharField()
    distribution = serializers.DictField(child=serializers.IntegerField())
    by_question_type = serializers.DictField(child=serializers.FloatField())


class HomeworkMetricsSerializer(serializers.Serializer):
    avg_score = serializers.FloatField()


class AttendanceMetricsSerializer(serializers.Serializer):
    present_percent = serializers.FloatField()
    late_percent = serializers.FloatField()
    absent_percent = serializers.FloatField()


class GroupMetricsSerializer(serializers.Serializer):
    percentile = serializers.FloatField()


class StudentPerformanceSerializer(serializers.Serializer):
    tests = TestMetricsSerializer()
    homework = HomeworkMetricsSerializer()
    attendance = AttendanceMetricsSerializer()
    overall_score = serializers.FloatField()
    group = GroupMetricsSerializer(required=False)


class GroupPerformanceSerializer(serializers.Serializer):
    tests = serializers.DictField()
