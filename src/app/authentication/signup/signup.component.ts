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
import { NzSelectModule } from "ng-zorro-antd/select";
import { ReactiveFormsModule } from "@angular/forms";
import { NzFormTooltipIcon } from "ng-zorro-antd/form";
import { NzAlertModule } from "ng-zorro-antd/alert";
import { NzSpinModule } from "ng-zorro-antd/spin";
import { Router } from "@angular/router";
import { AuthService } from "../auth.service";

@Component({
  selector: "app-signup",
  standalone: true,
  imports: [
    CommonModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    ReactiveFormsModule,
    NzAlertModule,
    NzSpinModule,
  ],
  templateUrl: "./signup.component.html",
  styleUrls: ["./signup.component.css"],
})
export default class NotAuthorizedComponent {
  router = inject(Router);
  auth = inject(AuthService);
  typeAlert: "error" | "info" | "success" | "warning" = "success";
  messageAlert: string = "";
  showAlert = false;
  spinner = false;
  validateForm: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
    checkPassword: FormControl<string>;
    nickname: FormControl<string>;
  }>;
  captchaTooltipIcon: NzFormTooltipIcon = {
    type: "info-circle",
    theme: "twotone",
  };
  constructor(private fb: NonNullableFormBuilder) {
    this.validateForm = this.fb.group({
      email: ["", [Validators.email, Validators.required]],
      password: ["", [Validators.required, this.passwordValidator]],
      checkPassword: ["", [Validators.required, this.confirmationValidator]],
      nickname: ["", [Validators.required]],
    });
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      this.spinner = true;
      this.auth
        .registerUser(
          this.validateForm.value.email!,
          this.validateForm.value.password!,
          this.validateForm.value.nickname!
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
    /** wait for refresh value */
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

  getCaptcha(e: MouseEvent): void {
    e.preventDefault();
  }

  goToHome() {
    this.router.navigate(["home"]);
  }
}
