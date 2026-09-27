export class UserResponseDto {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

export class AuthResponseDto {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
}
