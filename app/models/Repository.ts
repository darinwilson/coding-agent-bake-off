import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"

/**
 * Contributor model for repository contributors
 */
const ContributorModel = types.model("Contributor", {
  login: types.string,
  id: types.number,
  avatar_url: types.string,
  html_url: types.string,
  contributions: types.number,
})

/**
 * Repository model representing a GitHub repository with its metadata,
 * README content, and contributors information.
 */
export const RepositoryModel = types
  .model("Repository")
  .props({
    id: types.identifierNumber,
    name: types.string,
    full_name: types.string,
    description: types.maybeNull(types.string),
    html_url: types.string,
    stargazers_count: types.number,
    forks_count: types.number,
    language: types.maybeNull(types.string),
    updated_at: types.string,
    readme: types.optional(types.string, ""),
    contributors: types.optional(types.array(ContributorModel), []),
  })
  .actions(withSetPropAction)
  .views((self) => ({
    get formattedStars() {
      if (self.stargazers_count >= 1000) {
        return `${(self.stargazers_count / 1000).toFixed(1)}k`
      }
      return self.stargazers_count.toString()
    },
    get formattedForks() {
      if (self.forks_count >= 1000) {
        return `${(self.forks_count / 1000).toFixed(1)}k`
      }
      return self.forks_count.toString()
    },
    get shortDescription() {
      if (!self.description) return "No description available"
      return self.description.length > 100
        ? `${self.description.substring(0, 100)}...`
        : self.description
    },
    get readmePreview() {
      if (!self.readme) return "README not available"
      return self.readme.length > 500
        ? `${self.readme.substring(0, 500)}...`
        : self.readme
    }
  }))

export interface Repository extends Instance<typeof RepositoryModel> {}
export interface RepositorySnapshotOut extends SnapshotOut<typeof RepositoryModel> {}
export interface RepositorySnapshotIn extends SnapshotIn<typeof RepositoryModel> {}
