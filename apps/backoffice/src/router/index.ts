import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import LoginView from "../views/LoginView.vue";
import DashboardView from "../views/DashboardView.vue";
import ReportsListView from "../views/ReportsListView.vue";
import ReportDetailView from "../views/ReportDetailView.vue";
import ReportsExportView from "../views/ReportsExportView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { requiresAuth: false },
    },
    {
      path: "/",
      name: "dashboard",
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: "/reports",
      name: "reports",
      component: ReportsListView,
      meta: { requiresAuth: true },
    },
    {
      path: "/reports/:id",
      name: "report-detail",
      component: ReportDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: "/export",
      name: "export",
      component: ReportsExportView,
      meta: { requiresAuth: true },
    },
  ],
});

/** Guard de autenticación: redirige a login si no hay token */
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next("/login");
  } else if (to.path === "/login" && auth.isAuthenticated) {
    next("/");
  } else {
    next();
  }
});

export default router;
