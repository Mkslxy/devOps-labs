"use client";

import { ProfileInfoCard } from "@/components/profile/ProfileInfoCard";
import { ProfileRolesTreeCard } from "@/components/profile/ProfileRolesTreeCard";

export default function ManagerProfilePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="mb-2 text-3xl font-bold">Профіль</h1>
                <p className="text-muted-foreground">
                    Керуйте вашою особистою інформацією
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
                <div className="min-w-0">
                    <ProfileInfoCard showSchools />
                </div>

                <div className="min-w-0">
                    <ProfileRolesTreeCard />
                </div>
            </div>
        </div>
    );
}