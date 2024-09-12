export interface UserMetadata {
  nickname: string;
  profile_image: string;
}

export interface UserAuth {
  email: string;
  picture: string;
  user_metadata: UserMetadata;
}
