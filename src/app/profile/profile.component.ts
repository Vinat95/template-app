import { Component, inject, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { NzAlertModule } from "ng-zorro-antd/alert";
import { NzFlexModule } from "ng-zorro-antd/flex";
import { NzFormModule } from "ng-zorro-antd/form";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzInputModule } from "ng-zorro-antd/input";
import { NzModalModule } from "ng-zorro-antd/modal";
import { NzSpinModule } from "ng-zorro-antd/spin";
import { NzButtonModule } from "ng-zorro-antd/button";
import {
  NzUploadChangeParam,
  NzUploadFile,
  NzUploadModule,
} from "ng-zorro-antd/upload";
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { AuthService as Auth0Service } from "@auth0/auth0-angular";
import { UserAuth } from "../data/update-user.data";
import { Observable, Subject, switchMap, takeUntil, tap } from "rxjs";
import { LoadingService } from "../services/loading.service";
import { AlertService } from "../services/alert.service";

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
    NzFlexModule,
    NzButtonModule,
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
export default class ProfilepageComponent implements OnDestroy {
  router = inject(Router);
  auth = inject(AuthService);
  auth0 = inject(Auth0Service);
  submit$: Observable<any> = new Observable();
  typeAlert: "error" | "info" | "success" | "warning" = "success";
  formData: FormData = new FormData();
  image_key: string = "";
  profileImageUrl: string = "";
  messageAlert: string = "";
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
  private destroy$ = new Subject<void>(); //Per effettuare unsubscribe degli observable che non completano

  constructor(
    private fb: NonNullableFormBuilder,
    private loadingService: LoadingService,
    private alertService: AlertService
  ) {
    this.validateForm = this.fb.group({
      email: ["", [Validators.email, Validators.required]],
      nickname: ["", [Validators.required]],
      profileImage: [""],
    });
    this.validateForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.alertService.hideAlert();
      });
    this.loadingService.show();
    this.auth.getUserDetails(this.auth.user()?.sub!).subscribe({
      next: (res: any) => {
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
      error: (error) => {
        this.loadingService.hide();
        this.alertService.showAlert("error", error.message);
      },
      complete: () => {
        this.loadingService.hide();
      },
    });
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      this.validateForm.markAsUntouched();
      this.alertService.hideAlert();
      this.populateBodyUpdateUser();
      this.buildObservable();
      this.loadingService.show();
      this.submit$.subscribe({
        next: (res) => {
          this.alertService.showAlert("success", "Edit profile successful");
          this.auth.updateProfileImage(
            this.user.picture
              ? this.user.picture
              : "https://profile-image-template-app.s3.amazonaws.com/avatar-profile.jpg"
          );
          setTimeout(() => {
            this.router.navigate(["home"]);
            this.alertService.hideAlert();
          }, 3000);
        },
        error: (error) => {
          this.loadingService.hide();
          this.alertService.showAlert("error", error.message);
        },
        complete: () => {
          this.loadingService.hide();
        },
      });
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
    this.auth.profileImage$.subscribe({
      next: (url) => {
        this.profileImageUrl = url ? url : "";
      },
      error: (err) => {
        console.log(err);
      },
    });
    if (this.emptiedProfileImage) {
      this.image_key = this.profileImageUrl
        ? this.profileImageUrl.split("/")[3]
        : this.auth.user()?.picture!.split("/")[3]!;
      if (this.image_key !== "avatar-profile.jpg") {
        this.submit$ = this.auth.uploadImageToS3Bucket(this.formData).pipe(
          tap((res: any) => {
            this.populateProfileImage(res.url);
          }),
          switchMap(() => {
            return this.auth.deleteImageFromS3Bucket(this.image_key);
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
    this.alertService.hideAlert();
    this.validateForm.reset();
  }

  handlePreview = async (file: NzUploadFile): Promise<void> => {
    if (!file.url && !file["preview"]) {
      file["preview"] = await getBase64(file.originFileObj!);
    }
    this.previewImage = file.url || file["preview"];
    this.previewVisible = true;
  };

  beforeUploadImage = (file: NzUploadFile): boolean => {
    const isLt100kb = file.size! / 1024 < 100; //100Kb
    const isJpeg = file.type === "image/jpeg";
    this.validateForm.markAsUntouched();

    if (!isJpeg) {
      this.alertService.showAlert(
        "error",
        "Il file deve essere in formato JPEG."
      );
      return false;
    }

    if (!isLt100kb) {
      this.alertService.showAlert(
        "error",
        "La dimensione del file non deve superare i 100 KB."
      );
      return false;
    }

    this.alertService.hideAlert();
    this.messageAlert = "";
    return true;
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
