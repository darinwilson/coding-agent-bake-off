import { Instance, SnapshotOut, types, flow } from "mobx-state-tree"
import { api } from "../services/api"
import { RepositoryModel, type RepositorySnapshotIn } from "./Repository"
import { withSetPropAction } from "./helpers/withSetPropAction"

export const RepositoryStoreModel = types
  .model("RepositoryStore")
  .props({
    repositories: types.array(RepositoryModel),
    searchFilter: types.optional(types.string, ""),
    isLoading: types.optional(types.boolean, false),
    isLoadingDetails: types.optional(types.boolean, false),
  })
  .actions(withSetPropAction)
  .actions((self) => ({
    setSearchFilter(filter: string) {
      self.searchFilter = filter
    },

    fetchRepositories: flow(function* () {
      self.isLoading = true
      try {
        const result = yield api.getInfiniteRedRepos()
        if (result.kind === "ok") {
          self.repositories.replace(result.repositories)
        } else {
          if (__DEV__) {
            console.error("Failed to fetch repositories:", result)
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error("Error fetching repositories:", error)
        }
      } finally {
        self.isLoading = false
      }
    }),

    fetchRepositoryDetails: flow(function* (repoName: string) {
      self.isLoadingDetails = true
      try {
        const repo = self.repositories.find(r => r.name === repoName)
        if (!repo) return

        // Fetch README
        const readmeResult = yield api.getRepositoryReadme("infinitered", repoName)
        if (readmeResult.kind === "ok") {
          repo.setProp("readme", readmeResult.readme)
        } else if (__DEV__) {
          console.warn("Failed to fetch README for", repoName, readmeResult)
        }

        // Fetch contributors
        const contributorsResult = yield api.getRepositoryContributors("infinitered", repoName)
        if (contributorsResult.kind === "ok") {
          repo.setProp("contributors", contributorsResult.contributors)
        } else if (__DEV__) {
          console.warn("Failed to fetch contributors for", repoName, contributorsResult)
        }
      } catch (error) {
        if (__DEV__) {
          console.error("Error fetching repository details:", error)
        }
      } finally {
        self.isLoadingDetails = false
      }
    }),
  }))
  .views((self) => ({
    get filteredRepositories() {
      if (!self.searchFilter) return self.repositories

      const filter = self.searchFilter.toLowerCase()
      return self.repositories.filter(repo =>
        repo.name.toLowerCase().includes(filter) ||
        (repo.description && repo.description.toLowerCase().includes(filter)) ||
        (repo.language && repo.language.toLowerCase().includes(filter))
      )
    },

    getRepositoryByName(name: string) {
      return self.repositories.find(repo => repo.name === name)
    }
  }))

export interface RepositoryStore extends Instance<typeof RepositoryStoreModel> {}
export interface RepositoryStoreSnapshot extends SnapshotOut<typeof RepositoryStoreModel> {}
