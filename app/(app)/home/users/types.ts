export type PersonRoleCode = "STUDENT" | "INTERN" | "TEACHER" | "ASSISTANT";
export type UserRoleCode = "ADMINISTRATOR" | "USER";

interface Role<TCode extends string> {
  id: number;
  code: TCode;
  name: string;
}

interface UserPerson {
  id: number;
  name: string;
  paternal_surname: string;
  maternal_surname: string;
  email: string;
  person_role: Role<PersonRoleCode>;
}

export interface User {
  id: number;
  username: string;
  person: UserPerson;
  user_role: Role<UserRoleCode>;
  is_active: boolean;
}

export interface UserDetail extends User {
  person: UserPerson & {
    created_at: string;
  };
  created_at: string;
}

export interface UserListResponse {
  count: number;
  items: User[];
}
