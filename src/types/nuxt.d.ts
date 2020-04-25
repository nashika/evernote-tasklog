import { Route } from "vue-router";
import { Store } from "vuex";
import { AxiosInstance } from "axios";

export interface NuxtContext {
  isClient: boolean;
  isServer: boolean;
  isStatic: boolean;
  isDev: boolean;
  isHMR: boolean;
  route: Route;
  store: Store<any>;
  env: object;
  query: object;
  nuxtState: object;
  req: Request;
  res: Response;
  params: { [key: string]: any };
  redirect: (code: number, path: string) => void;
  error: (params: { statusCode?: String; message?: String }) => void;
  // @ts-ignore
  beforeNuxtRender: (params: { Conmponents?: any; nuxtState: any }) => void;
  $axios: AxiosInstance; // axios-moduleを利用している場合
}
