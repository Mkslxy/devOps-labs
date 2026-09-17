import { School} from "@/store/school/school.type";

export type UserRole =
  | "student"
  | "teacher"
  | "manager"
  | "methodologist"
  | "financier"
  | "director"
  | "tutor";

export interface Role {
  id: number;
  name: string;
  slug: string;
}

export interface RoleResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Role[];
}


export interface UserFormData {
  phone_normalized?: string;
  id?:number;
  full_name: string;
  email: string;
  phone_country_code: string;
  schools?: School[];
  school_ids?: number[];
  city?: string;
  phone_national_number: string;
  date_of_birth: string;
}

export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  phone_country_code: string;
  phone_national_number: string;
  phone_normalized: string;
  role: Role;
  city?: string;
  date_of_birth: string;
  schools?: number[];
  permissions: string[];
  is_google_calendar_connected?: boolean;
  groups: number[];
}

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  phone_country_code: string;
  phone_national_number: string;
  phone_normalized: string;
  role: Role;
  city?: string;
  date_of_birth: string;
  schools?: School[];
  permissions: string[];
  is_google_calendar_connected?: boolean;
  groups: number[];
}

export interface UserResponseLogin {
  message: string;
  user: UserResponse;
}

export interface UserRequestRegister {
  email: string;
  full_name: string;
  phone_country_code: string;
  phone_national_number: string;
  password: string;
  password_confirm: string;
  date_of_birth: string;
}

export interface UserRequestUpdateProfile {
  email: string;
  full_name: string;
  phone_country_code: string;
  phone_national_number: string;
  date_of_birth: string;
  city?: string;
  school_ids?: number[];
}

export interface ProfileRolesTreeUser {
  id?: number;
  full_name?: string;
  email?: string;
  phone_country_code?: string;
  phone_national_number?: string;
  phone_normalized?: string;
  date_of_birth?: string;
  city?: string;
  role?: Role | UserRole | string | null;
  schools?: School[] | number[];
  school_ids?: number[];
  groups?: number[];
  children?: ProfileRolesTreeUser[];
  users?: ProfileRolesTreeUser[];
  employees?: ProfileRolesTreeUser[];
  assigned_users?: ProfileRolesTreeUser[];
  subordinates?: ProfileRolesTreeUser[];
}

export type ProfileRolesTreeValue =
  | ProfileRolesTreeUser
  | ProfileRolesTreeUser[]
  | string
  | number
  | boolean
  | null;

export type ProfileRolesTreeResponse = Record<string, ProfileRolesTreeValue>;
