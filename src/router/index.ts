import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import ThreeDemo from "../views/ThreeDemo.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/home",
    },
    {
      path: "/home",
      name: "home",
      component: HomeView,
    },
    {
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/AboutView.vue"),
    },
    {
      path: "/three",
      name: "three",
      component: ThreeDemo,
    },
    {
      path: "/2",
      name: "2",
      component: () => import("../views/AframeDemo2.vue"),
    },
    // {
    //   path: "/3",
    //   name: "3",
    //   component: () => import("../views/AframeDemo3.vue"),
    // },
    {
      path: "/4",
      name: "4",
      component: () => import("../views/AframeDemo4.vue"),
    },
    {
      path: "/5",
      name: "5",
      component: () => import("../views/5.vue"),
    },
    {
      path: "/6",
      name: "6",
      component: () => import("../views/6.vue"),
    },
  ],
});

export default router;
