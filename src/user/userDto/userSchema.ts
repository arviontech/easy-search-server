export type TUserRole =
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'HOST'
  | 'DOCTOR'
  | 'CUSTOMER';

export type TUser = {
  name: string;
  email?: string;
  contactNumber: string;
  profilePhoto?: string;
  password: string;
  role: TUserRole;
};
