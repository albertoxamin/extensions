import { ActionPanel, List, OpenInBrowserAction, getPreferenceValues, Icon } from "@raycast/api";
import { linkDomain } from "./util";
import fetch from "node-fetch";
import { useEffect, useState } from "react";

export interface DashboardSummaryDefinition {
  popularity: number;
  tags: any[];
  is_favorite: boolean;
  id: string;
  icon: null;
  integration_id: null;
  is_shared: boolean;
  author: Author;
  url: string;
  title: string;
  modified: Date;
  created: Date;
  is_read_only: boolean;
  type: string;
}

export interface Author {
  handle: string;
  name: string;
}

type State = {
  dashboardsAreLoading: boolean;
  totalDashboards: number;
  dashboards: DashboardSummaryDefinition[];
};

type DashboardSearchApiResponse = {
  total: number;
  dashboards: DashboardSummaryDefinition[];
};

export default function CommandListDashboards() {
  const [{ dashboardsAreLoading, dashboards, totalDashboards }, setState] = useState<State>({
    dashboards: [],
    totalDashboards: 0,
    dashboardsAreLoading: true,
  });
  const search = (query: string) => {
    console.log("searching for dashboards", query);
    fetch(
      encodeURI(
        `https://app.datadoghq.com/api/v1/dashboard_search?with_suggested=true&query=${query}&start=0&count=50&sort=`
      ),
      {
        headers: {
          "DD-API-KEY": getPreferenceValues()["api-key"],
          "DD-APPLICATION-KEY": getPreferenceValues()["app-key"],
        },
      }
    )
      .then(res => res.json())
      .then(data => {
        const res = data as DashboardSearchApiResponse;
        setState(prev => ({
          ...prev,
          dashboards: res.dashboards,
          totalDashboards: res.total,
          dashboardsAreLoading: false,
        }));
      })
      .catch(err => {
        console.error(err);
      });
  };

  useEffect(() => {
    search("");
  }, []);

  return (
    <List isLoading={dashboardsAreLoading} onSearchTextChange={search}>
      <List.Section title={`Available dashboards ${totalDashboards}`}>
        {dashboards.map(dashboard => (
          <List.Item
            key={dashboard.id}
            icon={{ source: { light: "icon@light.png", dark: "icon@dark.png" } }}
            title={dashboard.title || "No title"}
            accessories={[
              { icon: dashboard.is_favorite ? Icon.Star : "", tooltip: "Favorite" },
              { icon: dashboard.is_shared ? Icon.Link : "", tooltip: "Shared" },
              { icon: Icon.Person, tooltip: dashboard.author.handle },
              {
                text: `${Array(dashboard.popularity + 1).join("I")}${Array(6 - dashboard.popularity).join(" ")}`,
                icon: Icon.Eye,
                tooltip: "Popularity",
              },
            ].filter(x => x.icon)}
            actions={
              <ActionPanel>
                <OpenInBrowserAction url={`https://${linkDomain()}${dashboard.url}`} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
