import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { NzFormModule } from "ng-zorro-antd/form";
import { NzInputModule } from "ng-zorro-antd/input";
import { ReactiveFormsModule } from "@angular/forms";
import { NzAlertModule } from "ng-zorro-antd/alert";
import { NzSpinModule } from "ng-zorro-antd/spin";
import { NzUploadChangeParam, NzUploadModule } from "ng-zorro-antd/upload";
import { NzModalModule } from "ng-zorro-antd/modal";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzUploadFile } from "ng-zorro-antd/upload";
import { Router } from "@angular/router";
import { AuthService } from "../auth.service";
import { switchMap, tap } from "rxjs";
import { UserRegister } from "../../data/update-user.data";
import { NzFlexModule } from "ng-zorro-antd/flex";
import { NzButtonModule } from "ng-zorro-antd/button";
import { LoadingService } from "../../loading.service";
import { AlertService } from "../../alert.service";

const getBase64 = (file: File): Promise<string | ArrayBuffer | null> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

@Component({
  selector: "app-signup",
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    ReactiveFormsModule,
    NzAlertModule,
    NzSpinModule,
    NzUploadModule,
    NzModalModule,
    NzIconModule,
    NzFlexModule,
  ],
  templateUrl: "./signup.component.html",
  styleUrls: ["./signup.component.css"],
})
export default class NotAuthorizedComponent {
  router = inject(Router);
  auth = inject(AuthService);
  typeAlert: "error" | "info" | "success" | "warning" = "success";
  formData: FormData = new FormData();
  messageAlert: string = "";
  image_key: string = "";
  fileList: NzUploadFile[] = [];
  previewImage: string | undefined = "";
  previewVisible = false;
  user: UserRegister = {
    email: "",
    password: "",
    picture: "",
    user_metadata: { nickname: "" },
  };
  validateForm: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
    checkPassword: FormControl<string>;
    nickname: FormControl<string>;
    profileImage: FormControl<string>;
  }>;
  //TODO: togliere l'alert anche quando è Untouched il form
  constructor(
    private fb: NonNullableFormBuilder,
    private loadingService: LoadingService,
    private alertService: AlertService
  ) {
    this.validateForm = this.fb.group({
      email: ["", [Validators.email, Validators.required]],
      password: ["", [Validators.required, this.passwordValidator]],
      checkPassword: ["", [Validators.required, this.confirmationValidator]],
      nickname: ["", [Validators.required]],
      profileImage: [""],
    });
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      this.alertService.hideAlert();
      this.validateForm.markAsUntouched();
      this.populateBodyUserRegister();
      this.loadingService.show();
      this.auth
        .uploadImageToS3Bucket(this.formData)
        .pipe(
          tap((res: any) => {
            this.populateProfileImage(res.url);
          }),
          switchMap((res: any) => this.auth.registerUser(this.user))
        )
        .subscribe(
          (next) => {
            this.alertService.showAlert("success", "Signup successful");
            setTimeout(() => {
              this.router.navigate(["home"]);
            }, 3000);
          },
          (error) => {
            if (
              this.user.picture &&
              this.user.picture !==
                "https://profile-image-template-app.s3.amazonaws.com/avatar-profile.jpg"
            ) {
              this.image_key = this.user.picture!.split("/")[3];
              this.auth.deleteImageFromS3Bucket(this.image_key).subscribe();
            }
            this.alertService.showAlert("error", error.message);
            this.loadingService.hide();
          },
          () => {
            this.loadingService.hide();
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

  populateBodyUserRegister() {
    this.user.email = this.validateForm.get("email")
      ? this.validateForm.get("email")?.value!
      : "";
    this.user.password = this.validateForm.get("password")
      ? this.validateForm.get("password")?.value!
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

  updateConfirmValidator(): void {
    Promise.resolve().then(() =>
      this.validateForm.controls.checkPassword.updateValueAndValidity()
    );
  }

  confirmationValidator: ValidatorFn = (
    control: AbstractControl
  ): { [s: string]: boolean } => {
    if (!control.value) {
      return { required: true };
    } else if (control.value !== this.validateForm.controls.password.value) {
      return { confirm: true, error: true };
    }
    return {};
  };

  passwordValidator: ValidatorFn = (
    control: AbstractControl
  ): { [key: string]: any } => {
    if (control.value) {
      const password = control.value;
      const regex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
      const valid = regex.test(password);
      return !valid ? { invalidPassword: { value: control.value } } : {};
    }
    return {};
  };

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

  onChangeUpload(event: NzUploadChangeParam) {
    if (event.type === "removed") {
      this.formData = new FormData();
    }
    if (event.type === "error") {
      const file = event.file.originFileObj as File;
      this.formData.append("file", file);
    }
  }

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

  goToHome() {
    this.router.navigate(["home"]);
  }
}
