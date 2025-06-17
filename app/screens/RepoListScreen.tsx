import { observer } from "mobx-react-lite"
import { FC, useEffect } from "react"
import { ViewStyle, TextStyle, ActivityIndicator } from "react-native"
import { Screen, Text, TextField, ListView, EmptyState, Card } from "@/components"
import { AppStackScreenProps } from "../navigators"
import { $styles, type ThemedStyle } from "@/theme"
import { useHeader } from "../utils/useHeader"
import { useAppTheme } from "@/utils/useAppTheme"
import { useStores } from "@/models"
import { Repository } from "@/models/Repository"

interface RepoListScreenProps extends AppStackScreenProps<"RepoList"> {}

export const RepoListScreen: FC<RepoListScreenProps> = observer(function RepoListScreen(_props) {
  const { themed } = useAppTheme()
  const { navigation } = _props
  const { repositoryStore } = useStores()

  useEffect(() => {
    repositoryStore.fetchRepositories()
  }, [repositoryStore])


  useHeader({
    title: "Infinite Red Repos",
  })

  const handleRepoPress = (repo: Repository) => {
    navigation.navigate("RepoDetail", { repoName: repo.name })
  }

  const handleSearchChange = (text: string) => {
    repositoryStore.setSearchFilter(text)
  }

  const renderRepo = ({ item }: { item: Repository }) => {
    return (
      <Card
        style={themed($repoCard)}
        onPress={() => handleRepoPress(item)}
        heading={item.name || "No name"}
        content={item.shortDescription || "No description"}
        footer={`⭐ ${item.formattedStars || item.stargazers_count || 0} • ${item.language || 'Unknown'}`}
        headingStyle={themed($repoTitle)}
        contentStyle={themed($description)}
        footerStyle={themed($stats)}
      />
    )
  }

  if (repositoryStore.isLoading && repositoryStore.repositories.length === 0) {
    return (
      <Screen preset="fixed" contentContainerStyle={$styles.flex1}>
        <ActivityIndicator size="large" style={themed($loadingContainer)} />
      </Screen>
    )
  }

  return (
    <Screen preset="fixed" contentContainerStyle={$styles.flex1}>
      <TextField
        placeholder="Search repositories..."
        value={repositoryStore.searchFilter}
        onChangeText={handleSearchChange}
        containerStyle={themed($searchContainer)}
      />

      {repositoryStore.filteredRepositories.length === 0 && !repositoryStore.isLoading ? (
        <EmptyState
          preset="generic"
          heading="No repositories found"
          content="We couldn't find any repositories to display."
        />
      ) : (
        <ListView
          data={repositoryStore.filteredRepositories}
          renderItem={renderRepo}
          estimatedItemSize={60}
          contentContainerStyle={themed($listContainer)}
        />
      )}
    </Screen>
  )
})

const $searchContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginHorizontal: spacing.md,
  marginVertical: spacing.sm,
})

const $listContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
})

const $repoCard: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginVertical: spacing.xs,
})

const $description: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.xs,
  color: colors.textDim,
})

const $stats: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.xs,
  color: colors.textDim,
  fontSize: 12,
})

const $repoTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontWeight: "bold",
  color: colors.text,
})

const $loadingContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.lg,
})
