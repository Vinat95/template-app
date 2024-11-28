import { Component, inject, OnDestroy } from "@angular/core";
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
import { AuthService } from "../../services/auth.service";
import { Subject, switchMap, takeUntil, tap } from "rxjs";
import { UserLogin, UserRegister } from "../../data/update-user.data";
import { NzFlexModule } from "ng-zorro-antd/flex";
import { NzButtonModule } from "ng-zorro-antd/button";
import { LoadingService } from "../../services/loading.service";
import { AlertService } from "../../services/alert.service";
import { environment } from "../../../environments/environment";

const getBase64 = (file: File): Promise<string | ArrayBuffer | null> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

@Component({
  selector: "app-login",
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
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export default class LoginComponent implements OnDestroy {
  router = inject(Router);
  auth = inject(AuthService);
  typeAlert: "error" | "info" | "success" | "warning" = "success";
  formData: FormData = new FormData();
  messageAlert: string = "";
  image_key: string = "";
  fileList: NzUploadFile[] = [];
  previewImage: string | undefined = "";
  previewVisible = false;
  showPassword = false;
  user: UserLogin = {
    email: "",
    password: "",
  };
  validateForm: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }>;
  private destroy$ = new Subject<void>(); //Per effettuare unsubscribe degli observable che non completano

  constructor(
    private fb: NonNullableFormBuilder,
    private alertService: AlertService
  ) {
    this.validateForm = this.fb.group({
      email: ["", [Validators.email, Validators.required]],
      password: ["", [Validators.required, this.passwordValidator]],
    });
    this.validateForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.alertService.hideAlert();
      });
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      this.alertService.hideAlert();
      this.validateForm.markAsUntouched();
      this.populateBodyUserLogin();
      // this.auth
      //   .uploadImageToS3Bucket(this.formData)
      //   .pipe(
      //     tap((res: any) => {
      //       this.populateProfileImage(res.url);
      //     }),
      //     switchMap((res: any) => this.auth.registerUser(this.user))
      //   )
      //   .subscribe({
      //     next: (next) => {
      //       this.alertService.showAlert("success", "Signup successful");
      //       setTimeout(() => {
      //         this.router.navigate(["home"]);
      //       }, 3000);
      //     },
      //     error: (error) => {
      //       if (
      //         this.user.picture &&
      //         this.user.picture !== environment.initImage
      //       ) {
      //         this.image_key = this.user.picture!.split("/")[3];
      //         this.auth.deleteImageFromS3Bucket(this.image_key).subscribe();
      //       }
      //       this.alertService.showAlert("error", error.message);
      //     },
      //   });
    } else {
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  populateBodyUserLogin() {
    this.user.email = this.validateForm.get("email")
      ? this.validateForm.get("email")?.value!
      : "";
    this.user.password = this.validateForm.get("password")
      ? this.validateForm.get("password")?.value!
      : "";
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

  visibilityPassword() {
    this.showPassword = !this.showPassword;
    let password: HTMLInputElement = document.getElementById(
      "password"
    ) as HTMLInputElement;
    password.type = password.type === "text" ? "password" : "text";
  }

  goToSignUp() {
    this.router.navigate(["signup"]);
  }

  goToHome() {
    this.router.navigate(["home"]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
