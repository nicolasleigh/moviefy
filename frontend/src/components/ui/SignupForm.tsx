import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BsGoogle } from "react-icons/bs";
import { Form, FormField } from "./form";
import CustomLink from "../CustomLink";
import { useEffect, useState } from "react";
import { createUser } from "@/api/auth";
import { useAuth, useNotification } from "@/hooks";
import { useNavigate } from "react-router-dom";
import { isValidEmail } from "@/utils/helper";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const validateUserInfo = ({ name, email, password }) => {
  const isValidName = /^[a-z A-Z]+$/;

  if (!name.trim()) {
    return { ok: false, error: "Name is missing!" };
  }
  if (!isValidName.test(name)) {
    return { ok: false, error: "Name is invalid!" };
  }

  if (!email.trim()) {
    return { ok: false, error: "Email is missing!" };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "Invalid email!" };
  }

  if (!password.trim()) {
    return { ok: false, error: "Password is missing!" };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be 8 characters!" };
  }

  return { ok: true };
};

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const { authInfo } = useAuth();
  const { isLoggedIn } = authInfo;

  const handleChange = ({ target }) => {
    // console.log(target);
    const { value, name } = target;
    setUserInfo({ ...userInfo, [name]: value });
    // console.log(target.value, target.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(userInfo);
    const { ok, error } = validateUserInfo(userInfo);
    if (!ok) return toast.error(t(error as string));

    const response = await createUser(userInfo);
    // already defined 'error', so don't use desctructuring
    console.log(response);
    if (response.error) return toast.error(t(response.error));
    navigate("/auth/verification", {
      state: { user: response.user },
      replace: true,
    });
  };
  const { t } = useTranslation();

  useEffect(() => {
    if (isLoggedIn) navigate("/");
  }, [isLoggedIn]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("Welcome")}</CardTitle>
          <CardDescription>
            {t("Sign up with your Google account")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Button variant="outline" className="w-full" type="button">
                  <BsGoogle />
                  {t("Sign up with Google")}
                </Button>
              </div>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  {t("Or continue with email")}
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">{t("Username")}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t("John Doe")}
                    required
                    name="name"
                    onChange={handleChange}
                    value={userInfo.username}
                  />
                  <Label htmlFor="email">{t("Email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    onChange={handleChange}
                    name="email"
                    value={userInfo.email}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">{t("Password")}</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="****************"
                    name="password"
                    onChange={handleChange}
                    value={userInfo.password}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {t("Sign up button")}
                </Button>
              </div>
              <div className="text-center text-sm">
                {t("Already have an account? ")}
                <CustomLink to="/auth/signin">{t("click to login")}</CustomLink>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
