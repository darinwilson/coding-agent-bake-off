/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://docs.infinite.red/ignite-cli/boilerplate/app/services/#backend-api-integration)
 * documentation for more details.
 */
import { ApiResponse, ApisauceInstance, create } from "apisauce"
import Config from "../../config"
import { GeneralApiProblem, getGeneralApiProblem } from "./apiProblem"
import type { ApiConfig, ApiFeedResponse, GitHubRepository, GitHubContributor, GitHubReadmeResponse } from "./api.types"
import type { EpisodeSnapshotIn } from "../../models/Episode"
import type { RepositorySnapshotIn } from "../../models/Repository"

/**
 * Configuring the apisauce instance.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.API_URL,
  timeout: 10000,
}

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  apisauce: ApisauceInstance
  config: ApiConfig

  /**
   * Set up our API instance. Keep this lightweight!
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })
  }

  /**
   * Gets a list of recent React Native Radio episodes.
   */
  async getEpisodes(): Promise<{ kind: "ok"; episodes: EpisodeSnapshotIn[] } | GeneralApiProblem> {
    // make the api call
    const response: ApiResponse<ApiFeedResponse> = await this.apisauce.get(
      `api.json?rss_url=https%3A%2F%2Ffeeds.simplecast.com%2FhEI_f9Dx`,
    )

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      const rawData = response.data

      // This is where we transform the data into the shape we expect for our MST model.
      const episodes: EpisodeSnapshotIn[] =
        rawData?.items.map((raw) => ({
          ...raw,
        })) ?? []

      return { kind: "ok", episodes }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  /**
   * Gets a list of public repositories for Infinite Red organization.
   */
  async getInfiniteRedRepos(): Promise<{ kind: "ok"; repositories: RepositorySnapshotIn[] } | GeneralApiProblem> {
    const githubApi = this.createGitHubApiInstance()

    const response: ApiResponse<GitHubRepository[]> = await githubApi.get("/orgs/infinitered/repos", {
      type: "public",
      sort: "updated",
      per_page: 100,
    })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      const rawData = response.data || []

      const repositories: RepositorySnapshotIn[] = rawData.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        language: repo.language,
        updated_at: repo.updated_at,
        readme: "",
        contributors: [],
      }))

      return { kind: "ok", repositories }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  /**
   * Gets the README content for a specific repository.
   */
  async getRepositoryReadme(owner: string, repo: string): Promise<{ kind: "ok"; readme: string } | GeneralApiProblem> {
    const githubApi = this.createGitHubApiInstance()

    const response: ApiResponse<GitHubReadmeResponse> = await githubApi.get(`/repos/${owner}/${repo}/readme`)

    if (!response.ok) {
      // README might not exist, return empty string instead of error
      if (response.status === 404) {
        return { kind: "ok", readme: "No README available for this repository." }
      }
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      const rawData = response.data

      // Decode base64 content
      let readme = ""
      if (rawData?.content && rawData?.encoding === "base64") {
        // Use atob for base64 decoding in React Native/web environments
        try {
          readme = decodeURIComponent(escape(atob(rawData.content.replace(/\s/g, ""))))
        } catch (e) {
          console.error("Failed to decode base64 README content:", e)
          readme = "Failed to decode README content"
        }
      }

      return { kind: "ok", readme }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  /**
   * Gets the contributors for a specific repository.
   */
  async getRepositoryContributors(owner: string, repo: string): Promise<{ kind: "ok"; contributors: GitHubContributor[] } | GeneralApiProblem> {
    const githubApi = this.createGitHubApiInstance()

    const response: ApiResponse<GitHubContributor[]> = await githubApi.get(`/repos/${owner}/${repo}/contributors`, {
      per_page: 10, // Limit to top 10 contributors
    })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      const rawData = response.data || []

      return { kind: "ok", contributors: rawData }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }
  /**
   * Creates a GitHub API instance with consistent configuration.
   */
  private createGitHubApiInstance() {
    return create({
      baseURL: "https://api.github.com",
      timeout: this.config.timeout,
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "InfiniteRed-RepoApp",
      },
    })
  }
}

// Singleton instance of the API for convenience
export const api = new Api()
