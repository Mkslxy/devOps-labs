import Image from "next/image";
import { Clock, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

const courses = [
  {
    id: 1,
    language: "Англійська",
    level: "Початковий",
    duration: "3 місяці",
    students: "1250 студентів",
    price: "3500 ₴",
    image: "/english-learning-classroom.jpg",
  },
  {
    id: 2,
    language: "Німецька",
    level: "Середній",
    duration: "4 місяці",
    students: "680 студентів",
    price: "3800 ₴",
    image: "/german-learning-books.jpg",
  },
  {
    id: 3,
    language: "Французька",
    level: "Просунутий",
    duration: "5 місяців",
    students: "420 студентів",
    price: "4200 ₴",
    image: "/french-learning-eiffel-tower.jpg",
  },
];

export function CoursesSection() {
  return (
    <section id="courses" className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-normal md:text-5xl">
            Наші курси
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Оберіть мову та рівень, який підходить вашим цілям.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden shadow-sm transition-shadow hover:shadow-xl">
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={course.image}
                  alt={course.language}
                  width={560}
                  height={320}
                  className="h-full w-full object-cover"
                />
                <Badge className="absolute right-4 top-4 bg-primary">
                  {course.level}
                </Badge>
              </div>

              <CardContent className="space-y-5 p-6">
                <h3 className="text-2xl font-bold">{course.language}</h3>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4" />
                    <span>Тривалість: {course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="size-4" />
                    <span>{course.students}</span>
                  </div>
                </div>

                <div className="text-3xl font-bold text-primary">
                  {course.price}
                  <span className="text-sm font-medium text-muted-foreground"> /міс</span>
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                <Button className="w-full" size="lg">
                  Записатись на курс
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button variant="outline" size="lg">
            Переглянути всі курси
          </Button>
        </div>
      </div>
    </section>
  );
}

