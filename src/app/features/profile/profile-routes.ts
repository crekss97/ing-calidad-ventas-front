import { Routes } from "@angular/router";
import { Profile } from "./profile";
import { authGuard } from "../../shared/guards/auth.guard";
import { UserRole } from "../auth/models/user.model";

export const ProfileRoutes: Routes = [
    {
        path: '',
        component: Profile,
        canActivate: [authGuard],
        data: {
            title: 'Perfil'
        }
    }
]