import { Locator, Page } from '@playwright/test';

const BASE_URL = 'http://localhost/';

export class AuthPage {
  private showLogin = true;
  private readonly page: Page;

  private readonly loginEmailInput: Locator;
  private readonly loginPasswordInput: Locator;

  private readonly regUsernameInput: Locator;
  private readonly regEmailInput: Locator;
  private readonly regEmailConfirmInput: Locator;
  private readonly regPasswordInput: Locator;
  private readonly regPasswordConfirmInput: Locator;

  private readonly singUpButton: Locator;
  private readonly signInButton: Locator;

  private readonly toSignIn: Locator;
  private readonly toSignUp: Locator;

  constructor(page: Page) {
    this.page = page;

    this.loginEmailInput = page.locator('#email');
    this.loginPasswordInput = page.locator('#password');

    this.regUsernameInput = page.locator('#username');
    this.regEmailInput = page.locator('#emailRegistration');
    this.regEmailConfirmInput = page.locator('#emailConfirm');
    this.regPasswordInput = page.locator('#passwordRegistration');
    this.regPasswordConfirmInput = page.locator('#passwordConfirm');

    this.singUpButton = page.locator('#sign-up');
    this.signInButton = page.locator('#sign-in');

    this.toSignUp = page.locator('#to-sign-up');
    this.toSignIn = page.locator('#to-sign-in');
  }

  public async goto() {
    await this.page.goto(BASE_URL);
  }

  public async changePanel() {
    if (this.showLogin) {
      this.toSignUp.click();
      this.showLogin = false;
    } else {
      this.toSignIn.click();
      this.showLogin = true;
    }
  }

  public async login(email: string, pass: string) {
    if (!this.showLogin) {
      this.changePanel();
    }

    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(pass);
    await this.signInButton.click();
  }

  public async register(username: string, email: string, pass: string) {
    if (this.showLogin) {
      this.changePanel();
    }

    await this.regUsernameInput.fill(username);
    await this.regEmailInput.fill(email);
    await this.regEmailConfirmInput.fill(email);
    await this.regPasswordInput.fill(pass);
    await this.regPasswordConfirmInput.fill(pass);

    await this.singUpButton.click();
  }
}
