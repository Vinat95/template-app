export interface UserMetadata {
  nickname: string;
  profile_image_base64: string;
}

export interface UserAuth {
  email: string;
  user_metadata: UserMetadata;
}
