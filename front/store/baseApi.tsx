import {createApi} from "@reduxjs/toolkit/query/react";
import {baseQueryWithReauth} from "@/store/fetchBaseQuery";

export const baseApi = createApi({
    reducerPath: "api",
    baseQuery: baseQueryWithReauth,
    tagTypes: [ "Student", "Teacher", "Group", "Role", "Course", "GradeBookGrade",
      "GradeBookColumn", "GradeBookAttendance", "GradeBookGrid" , "GoogleStatus",
      "Stats","StaffMeeting", "StaffMeetingLessonType", "Material", "Module", "Topic",
      "LessonType", "Lesson", "Question", "StudentResult", "TestAssignment", "TestVersion",
      "Test", "Attempt", "TakingTest", "AttemptReview", "HomeWork", "HomeWorkSubmission",
      "HomeWorkSubmissionReview","CallbackRequest","Lead","PnlCategory","PnlCurrency",
      "PnlPaymentMethod","PnlSubCategory","PnlTransaction","Manager","Financier","Methodist"
      ,"Trainings" , "Task" , "TaskSubmission" , "TaskReview" , "School" , "PnlCompanyBalance" ,
      "PnlSchoolBalance" , "Payment" , "Report" , "SalaryAdjustment" , "SalaryTariff" , "FeedBack" ,
      "SalaryPayout" , "SalaryPayoutRequest" , "Book" , "BookTransaction" , "SurveySurvey" , "SurveyResponse" ,
      "SurveyQuestion" , "SurveyAssignment" , "CourseAccess" , "SubscriptionPlan" , "StudentSubscription" ,
      "OnboardingStudentResult" , "OnboardingTestAssignment" , "OnboardingTestAttempt" , "User" , "Subject"
    ],
    endpoints: () => ({}),
});

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
