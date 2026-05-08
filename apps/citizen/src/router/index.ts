import { createRouter, createWebHistory } from "vue-router";
import { useCitizenAuth } from "../composables/useCitizenAuth";
import HomeView from "../views/HomeView.vue";
import SuccessView from "../views/SuccessView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
    },
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: "/success",
      name: "success",
      component: SuccessView,
      meta: { requiresAuth: true },
    },
  ],
});

/** Guard de autenticación: requiere login para denunciar */
router.beforeEach((to, _from, next) => {
  const { isAuthenticated } = useCitizenAuth();

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next("/login");
  } else if (to.path === "/login" && isAuthenticated.value) {
    next("/");
  } else {
    next();
  }
});

export default router;
