import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, NzResultModule, NzButtonModule],
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css'],
})
export default class NotFoundComponent {
  constructor(private router: Router) {}

  goToHome() {
    this.router.navigate(['home']);
  }
}
