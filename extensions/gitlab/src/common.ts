import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, concat, NormalizedCacheObject } from "@apollo/client";
import fetch from "node-fetch";

import { getPreferenceValues } from "@raycast/api";
import { GitLab } from "./gitlabapi";

export function createGitLabClient() {
  const preferences = getPreferenceValues();
  const instance = (preferences.instance as string) || "https://gitlab.com";
  const token = preferences.token as string;
  const gitlab = new GitLab(instance, token);
  return gitlab;
}

export class GitLabGQL {
  public url: string;
  public client: ApolloClient<NormalizedCacheObject>;
  constructor(url: string, client: ApolloClient<NormalizedCacheObject>) {
    this.url = url;
    this.client = client;
  }
  public urlJoin(url: string): string {
    return `${this.url}/${url}`;
  }
}

export function createGitLabGQLClient() {
  const preferences = getPreferenceValues();
  const instance = (preferences.instance as string) || "https://gitlab.com";
  const token = preferences.token as string;
  const graphqlEndpoint = `${instance}/api/graphql`;
  const httpLink = new HttpLink({ uri: graphqlEndpoint, fetch });

  const authMiddleware = new ApolloLink((operation, forward) => {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    }));
    return forward(operation);
  });

  const client = new ApolloClient({
    link: concat(authMiddleware, httpLink),
    cache: new InMemoryCache(),
  });
  return new GitLabGQL(instance, client);
}

export const gitlab = createGitLabClient();
export const gitlabgql = createGitLabGQLClient();

const defaultRefreshInterval = 10 * 1000;

export function getCIRefreshInterval(): number | null {
  const preferences = getPreferenceValues();
  const userValue = preferences.cirefreshinterval as string;
  if (!userValue || userValue.length <= 0) {
    return defaultRefreshInterval;
  }
  const sec = parseFloat(userValue);
  if (Number.isNaN(sec)) {
    console.log(`invalid value ${userValue}, fallback to null`);
    return null;
  }
  if (sec < 1) {
    return null;
  } else {
    return sec * 1000; // ms
  }
}
