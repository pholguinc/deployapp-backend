export interface UserProfileResponse {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  role: string;
  createdAt: Date;
}
