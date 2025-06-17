import { observer } from "mobx-react-lite"
import { FC, useEffect } from "react"
import { ViewStyle, ScrollView } from "react-native"
import { Screen, Text, Button, Card } from "@/components"
import { AppStackScreenProps } from "../navigators"
import { $styles, type ThemedStyle } from "@/theme"
import { useHeader } from "../utils/useHeader"
import { useAppTheme } from "@/utils/useAppTheme"
import { openLinkInBrowser } from "@/utils/openLinkInBrowser"
import { useStores } from "@/models"
import { Repository } from "@/models/Repository"

interface RepoDetailScreenProps extends AppStackScreenProps<"RepoDetail"> {}

export const RepoDetailScreen: FC<RepoDetailScreenProps> = observer(function RepoDetailScreen(_props) {
  const { themed } = useAppTheme()
  const { navigation, route } = _props
  const { repoName } = route.params
  const { repositoryStore } = useStores()

  const repository = repositoryStore.getRepositoryByName(repoName)

  useEffect(() => {
    if (repository) {
      repositoryStore.fetchRepositoryDetails(repoName)
    }
  }, [repository, repositoryStore, repoName])

  useHeader({
    title: repository?.name || repoName,
    leftIcon: "back",
    onLeftPress: () => navigation.goBack(),
  })

  const handleOpenGitHub = () => {
    if (repository) {
      openLinkInBrowser(repository.html_url)
    }
  }

  const renderContributorInfo = (repository: Repository) => {
    if (repositoryStore.isLoadingDetails) {
      return "Loading contributors..."
    }

    if (repository.contributors.length === 0) {
      return "No contributors found"
    }

    const contributorNames = repository.contributors
      .slice(0, 5) // Show only first 5 contributors
      .map((contributor) => contributor.login)
      .join(", ")

    const remaining = repository.contributors.length - 5
    return remaining > 0
      ? `${contributorNames} and ${remaining} more`
      : contributorNames
  }

  if (!repository) {
    return (
      <Screen preset="fixed" contentContainerStyle={$styles.flex1}>
        <Card style={themed($card)}>
          <Text preset="heading" text="Repository Not Found" />
          <Text text="The requested repository could not be found." />
          <Button
            text="Go Back"
            onPress={() => navigation.goBack()}
            style={themed($githubButton)}
          />
        </Card>
      </Screen>
    )
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)}>
      <ScrollView>
        <Card
          style={themed($card)}
          heading={repository.name}
          content={repository.shortDescription}
          footer={repository.language ? `Language: ${repository.language}` : undefined}
        />

        <Card
          style={themed($card)}
          heading="Statistics"
          content={`⭐ Stars: ${repository.formattedStars}\n🍴 Forks: ${repository.formattedForks}`}
        />

        <Card
          style={themed($card)}
          heading="README Preview"
          content={repository.readmePreview}
          contentStyle={themed($readme)}
        />

        <Card
          style={themed($card)}
          heading="Contributors"
          content={renderContributorInfo(repository)}
        />

        <Button
          text="View on GitHub"
          onPress={handleOpenGitHub}
          style={themed($githubButton)}
        />
      </ScrollView>
    </Screen>
  )
})

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
})

const $card: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $readme: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  fontFamily: "monospace",
})

const $githubButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})
