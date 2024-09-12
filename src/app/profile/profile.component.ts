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
import { NzUploadModule } from "ng-zorro-antd/upload";
import { Router } from "@angular/router";
import { AuthService } from "../authentication/auth.service";
import { AuthService as Auth0Service } from "@auth0/auth0-angular";
import { UserAuth } from "../data/update-user.data";

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
  typeAlert: "error" | "info" | "success" | "warning" = "success";
  messageAlert: string = "";
  showAlert = false;
  spinner = false;
  user: UserAuth = {
    email: "",
    picture: "",
    user_metadata: { nickname: "", profile_image: "" },
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
        this.validateForm.patchValue({
          email: res.data.email,
          nickname: res.data.user_metadata.nickname,
        });
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
      this.spinner = true;
      this.auth.updateUserDetails(this.auth.user()?.sub!, this.user).subscribe(
        (res) => {
          this.showAlert = true;
          this.typeAlert = "success";
          this.messageAlert = "Signup successful";
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

  populateBodyUpdateUser() {
    this.user.email = this.validateForm.get("email")
      ? this.validateForm.get("email")?.value!
      : "";
    this.user.user_metadata.nickname = this.validateForm.get("nickname")
      ? this.validateForm.get("nickname")?.value!
      : "";
  }

  resetForm() {
    this.validateForm.reset();
  }

  goToHome() {
    this.router.navigate(["home"]);
  }
}
