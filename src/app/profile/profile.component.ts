import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { NzAlertModule } from "ng-zorro-antd/alert";
import { NzFormModule } from "ng-zorro-antd/form";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzInputModule } from "ng-zorro-antd/input";
import { NzModalModule } from "ng-zorro-antd/modal";
import { NzSpinModule } from "ng-zorro-antd/spin";
import {
  NzUploadChangeParam,
  NzUploadFile,
  NzUploadModule,
} from "ng-zorro-antd/upload";
import { Router } from "@angular/router";
import { AuthService } from "../authentication/auth.service";
import { AuthService as Auth0Service } from "@auth0/auth0-angular";
import { UserAuth } from "../data/update-user.data";
import { Observable, switchMap, tap } from "rxjs";

const getBase64 = (file: File): Promise<string | ArrayBuffer | null> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [
    CommonModule,
    NzFormModule,
    NzInputModule,
    ReactiveFormsModule,
    NzAlertModule,
    NzSpinModule,
    NzUploadModule,
    NzModalModule,
    NzIconModule,
  ],
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"],
})
export default class ProfilepageComponent {
  router = inject(Router);
  auth = inject(AuthService);
  auth0 = inject(Auth0Service);
  submit$: Observable<any> = new Observable();
  typeAlert: "error" | "info" | "success" | "warning" = "success";
  formData: FormData = new FormData();
  image_key: string = "";
  profileImageUrl: string = "";
  messageAlert: string = "";
  showAlert = false;
  spinner = false;
  fileList: NzUploadFile[] = [];
  previewImage: string | undefined = "";
  previewVisible = false;
  emptiedProfileImage = false;
  user: UserAuth = {
    email: "",
    picture: "",
    user_metadata: { nickname: "" },
  };
  validateForm: FormGroup<{
    email: FormControl<string>;
    nickname: FormControl<string>;
    profileImage: FormControl<string>;
  }>;

  constructor(private fb: NonNullableFormBuilder) {
    this.validateForm = this.fb.group({
      email: ["", [Validators.email, Validators.required]],
      nickname: ["", [Validators.required]],
      profileImage: [""],
    });
    this.spinner = true;
    this.auth.getUserDetails(this.auth.user()?.sub!).subscribe(
      (res: any) => {
        this.populateProfileImage(res.data.picture);
        this.auth.updateProfileImage(res.data.picture);
        this.validateForm.patchValue({
          email: res.data.email,
          profileImage: res.data.picture,
          nickname: res.data.user_metadata.nickname,
        });
        this.fileList = [
          ...this.fileList,
          {
            uid: "1",
            name: "image." + res.data.picture.split(".").pop(),
            status: "done",
            url: res.data.picture,
          },
        ];
      },
      (error) => {
        this.spinner = false;
        console.log(error);
      },
      () => {
        this.spinner = false;
      }
    );
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      this.populateBodyUpdateUser();
      this.buildObservable();
      this.spinner = true;
      this.submit$.subscribe(
        (res) => {
          this.showAlert = true;
          this.typeAlert = "success";
          this.messageAlert = "Signup successful";
          this.auth.updateProfileImage(
            this.user.picture
              ? this.user.picture
              : "https://profile-image-template-app.s3.amazonaws.com/avatar-profile.jpg"
          );
          setTimeout(() => {
            this.router.navigate(["home"]);
          }, 3000);
        },
        (error) => {
          this.spinner = false;
          this.showAlert = true;
          this.typeAlert = "error";
          this.messageAlert = error.error.error.message
            ? error.error.error.message
            : error.error.description;
          console.log(error);
        },
        () => {
          this.spinner = false;
        }
      );
    } else {
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  buildObservable() {
    this.auth.profileImage$.subscribe(
      (url) => {
        this.profileImageUrl = url ? url : "";
      },
      (err) => {
        console.log(err);
      }
    );
    if (this.emptiedProfileImage) {
      this.image_key = this.profileImageUrl
        ? this.profileImageUrl.split("/")[3]
        : this.auth.user()?.picture!.split("/")[3]!;
      if (this.image_key !== "avatar-profile.jpg") {
        this.submit$ = this.auth.deleteImageFromS3Bucket(this.image_key).pipe(
          switchMap(() => {
            return this.auth.uploadImageToS3Bucket(this.formData);
          }),
          tap((res: any) => {
            this.populateProfileImage(res.url);
          }),
          switchMap(() => {
            return this.auth.updateUserDetails(
              this.auth.user()?.sub!,
              this.user
            );
          })
        );
      } else {
        this.submit$ = this.auth.uploadImageToS3Bucket(this.formData).pipe(
          tap((res: any) => {
            this.populateProfileImage(res.url);
          }),
          switchMap(() => {
            return this.auth.updateUserDetails(
              this.auth.user()?.sub!,
              this.user
            );
          })
        );
      }
    } else {
      this.submit$ = this.auth.updateUserDetails(
        this.auth.user()?.sub!,
        this.user
      );
    }
  }

  populateBodyUpdateUser() {
    this.user.email = this.validateForm.get("email")
      ? this.validateForm.get("email")?.value!
      : "";
    this.user.user_metadata.nickname = this.validateForm.get("nickname")
      ? this.validateForm.get("nickname")?.value!
      : "";
  }

  populateProfileImage(url: string) {
    this.user.picture = url
      ? url
      : "https://profile-image-template-app.s3.amazonaws.com/avatar-profile.jpg";
  }

  resetForm() {
    this.validateForm.reset();
  }

  handlePreview = async (file: NzUploadFile): Promise<void> => {
    if (!file.url && !file["preview"]) {
      file["preview"] = await getBase64(file.originFileObj!);
    }
    this.previewImage = file.url || file["preview"];
    this.previewVisible = true;
  };

  onChangeUpload(event: NzUploadChangeParam) {
    if (event.type === "removed") {
      this.formData = new FormData();
      this.emptiedProfileImage = true;
      this.validateForm.get("profileImage")?.markAsDirty();
    }
    if (event.type === "error") {
      const file = event.file.originFileObj as File;
      this.formData.append("file", file);
      this.validateForm.get("profileImage")?.markAsDirty();
    }
  }

  goToHome() {
    this.router.navigate(["home"]);
  }
}
