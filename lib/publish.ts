import { getFileSha, putFile } from "./github";

export type PublishInput = {
  githubRepo: string;
  contentPath: string;
  slug: string;
  content: string;
  repoBranch: string;
};

export async function publishArticle(input: PublishInput): Promise<void> {
  const { githubRepo, contentPath, slug, content, repoBranch } = input;

  const filePath = `${contentPath}/${slug}.mdx`;
  const sha = await getFileSha(githubRepo, filePath, repoBranch);

  await putFile(
    githubRepo,
    filePath,
    content,
    repoBranch,
    `content: add ${slug}`,
    sha
  );
}
