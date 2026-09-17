import com.lemonappdev.konsist.api.Konsist
import com.lemonappdev.konsist.api.architecture.KoArchitectureCreator.assertArchitecture
import com.lemonappdev.konsist.api.architecture.Layer
import com.lemonappdev.konsist.api.ext.list.withNameEndingWith
import com.lemonappdev.konsist.api.verify.assertTrue
import org.junit.jupiter.api.Test

/**
 * Deterministic, hard-fail layer boundary and convention checks for the sample app.
 * A failure here fails the build (see .github/workflows/architecture-check.yml) —
 * unlike the LLM-based SOLID reviewer, which is advisory-only.
 */
class ArchitectureTest {

    @Test
    fun `clean architecture layers respect their dependency direction`() {
        Konsist.scopeFromProject().assertArchitecture {
            val domain = Layer("Domain", "..domain..")
            val data = Layer("Data", "..data..")
            val presentation = Layer("Presentation", "..presentation..")

            domain.dependsOnNothing()
            data.dependsOn(domain)
            presentation.dependsOn(domain)
        }
    }

    @Test
    fun `classes ending with UseCase reside in a usecase package`() {
        Konsist.scopeFromProject()
            .classes()
            .withNameEndingWith("UseCase")
            .assertTrue { it.resideInPackage("..usecase..") }
    }

    @Test
    fun `repository interfaces do not leak framework or data-layer types`() {
        val forbiddenImportPrefixes = listOf(
            "retrofit2",
            "okhttp3",
            "android.",
            "androidx.",
            "com.guardrails.data"
        )

        Konsist.scopeFromProject()
            .interfaces()
            .withNameEndingWith("Repository")
            .assertTrue { repositoryInterface ->
                repositoryInterface.containingFile.imports.none { import ->
                    forbiddenImportPrefixes.any { forbidden -> import.name.startsWith(forbidden) }
                }
            }
    }

    @Test
    fun `repository implementations live in the data layer and implement a domain repository`() {
        Konsist.scopeFromProject()
            .classes()
            .withNameEndingWith("RepositoryImpl")
            .assertTrue { repositoryImpl ->
                repositoryImpl.resideInPackage("..data.repository..") &&
                    repositoryImpl.parents(false).any { it.name.endsWith("Repository") }
            }
    }

    @Test
    fun `view models reside in the presentation layer`() {
        Konsist.scopeFromProject()
            .classes()
            .withNameEndingWith("ViewModel")
            .assertTrue { it.resideInPackage("..presentation..") }
    }
}
