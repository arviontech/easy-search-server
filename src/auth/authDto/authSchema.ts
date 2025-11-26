export type TRegistration = {
  name: string;
  email: string;
  contactNumber: string;
  profilePhoto?: string;
  provider?: string;
  password?: string;
  role?: string;
  type?: 'offerService' | 'customer';
}



export type TLogin = {
  name?: string;
  email?: string;
  contactNumber?: string;
  profilePhoto?: string;
  provider?: string;
  password?: string;
};
