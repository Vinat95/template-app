import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AbstractControl, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from "@angular/forms";
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
  validateForm: FormGroup<{
    email: FormControl<string>;
    nickname: FormControl<string>;
    profileImage: FormControl<string>;
  }>;

  constructor(private fb: NonNullableFormBuilder) {
    this.validateForm = this.fb.group({
      email: [this.auth.user()?.email!, [Validators.email, Validators.required]],
      nickname: [this.auth.user()?.nickname!, [Validators.required]],
      profileImage: [""],
    });
  }

  submitForm(): void {
    if (this.validateForm.valid) {
    } else {
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  goToHome() {
    this.router.navigate(["home"]);
  }
}

