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
import { switchMap } from "rxjs";

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
    NzFormModule,
    NzInputModule,
    ReactiveFormsModule,
    NzAlertModule,
    NzSpinModule,
    NzUploadModule,
    NzModalModule,
    NzIconModule,
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
  showAlert = false;
  spinner = false;
  fileList: NzUploadFile[] = [];
  previewImage: string | undefined = "";
  previewVisible = false;
  validateForm: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
    checkPassword: FormControl<string>;
    nickname: FormControl<string>;
    profileImage: FormControl<string>;
  }>;

  constructor(private fb: NonNullableFormBuilder) {
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
      this.spinner = true;
      this.auth
        .uploadImageToS3Bucket(this.formData)
        .pipe(
          switchMap((res: any) =>
            this.auth.registerUser(
              this.validateForm.get("email")?.value!,
              this.validateForm.get("password")?.value!,
              this.validateForm.get("nickname")?.value!,
              res.url
            )
          )
        )
        .subscribe(
          (next) => {
            this.showAlert = true;
            this.typeAlert = "success";
            this.messageAlert = "Signup successful";
            setTimeout(() => {
              this.router.navigate(["home"]);
            }, 3000);
          },
          (error) => {
            this.showAlert = true;
            this.typeAlert = "error";
            this.messageAlert = error.error.message
              ? error.error.message
              : error.error.description;
            this.spinner = false;
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

  goToHome() {
    this.router.navigate(["home"]);
  }
}
