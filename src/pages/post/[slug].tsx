import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import Prismic from '@prismicio/client'
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Link from 'next/link';
import Comments from '../../components/Comments';
import { ExitPreviewButton } from '../../components/ExitPreviewButton';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  }
}

interface PostProps {
  post: Post;
  preview: boolean;
  prevPost: Post;
  nextPost:Post;
}

export default function Post({ post, preview, prevPost, nextPost }: PostProps) {
  const words = post.data.content.map(contentItem => {
    
    return {
      wordsInHeading: contentItem.heading.split(' ').length,
      wordsInBody: contentItem.body.map(contentBody => {
        return contentBody.text.split(' ').length
      }).reduce((acc, current) => acc += current)
    }
  })

  const totalWords =  words.map(item => item.wordsInHeading + item.wordsInBody)
    .reduce((acc, current) => acc + current)
  const readTime = Math.ceil(totalWords / 200);

  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const isPostEdited = post.first_publication_date !== post.last_publication_date;

  let postEdited;

  if (isPostEdited) {
    postEdited = format(new Date(post.last_publication_date), "'* editado em 'dd MMM yyyy', às 'H:m'", {locale: ptBR});
  }

  const otherPostsClasses = prevPost ? 
    styles.otherPosts : 
    `${styles.otherPosts} ${styles.nextPost}` // lógica para quando houver somente o "próx post" renderizar à direita da pág.

  return (
    <>
      <Head>
        <title>spacetraveling | {post.data.title}</title>
      </Head>

      <img src={post.data.banner.url} alt="banner" className={styles.banner} />

      <main className={commonStyles.container}>
        <div className={styles.post}>
          <div className={styles.header}>
            <h1>{post.data.title}</h1>
            <div className={styles.postInfo}>
              <div>
                <FiCalendar size={20} />
                <p>
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy', {
                    locale: ptBR,
                  })}
                </p>
              </div>

              <div>
                <FiUser size={20} />
                <p>{post.data.author}</p>
              </div>

              <div>
                <FiClock size={20} />
                <p>{readTime} min</p>
              </div>
            </div>

            {isPostEdited && 
              <div className={styles.postEdit}>
                <p>
                  {postEdited}
                </p>
              </div>
            }

            {post.data.content.map(({heading, body}) => (
              <article className={styles.postContent} key={heading}>
                <h2>{heading}</h2>

                <div dangerouslySetInnerHTML={{__html: RichText.asHtml(body)}} />
              </article>              
            ))}
          </div>

        </div>
        
        <section className={otherPostsClasses}>
          {prevPost && (
            <div className={styles.previousPost}>
              <p>{prevPost.data.title}</p>
              <Link href={`/post/${prevPost.uid}`}>
                <a>Post anterior</a>
              </Link>
            </div>
          )}

          {nextPost && (
            <div >
              <p>{nextPost.data.title}</p>
              <Link href={`/post/${nextPost.uid}`}>
                <a>Próximo Post</a>
              </Link>
            </div>
          )}
        </section>

        <section className={styles.commentsContainer}>
          <div>
            <Comments />
          </div>
        </section>

        {preview && (
          <ExitPreviewButton />
        )}

      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ]);

  const paths = posts.results.map(post => ({
    params: { slug: post.uid }
  }))

  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async ({ params, preview = false }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const postResponse = await prismic.getByUID('posts', String(slug), {});

  const previousPostResponse = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ], {
    pageSize: 1,
    orderings: '[document.first_publication_date]',
    after: postResponse.id
  })

  const nextPostResponse = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ], {
    pageSize: 1,
    orderings: '[document.first_publication_date desc]',
    after: postResponse.id
  })
  
  const prevPost = previousPostResponse.results[0] || null
  const nextPost = nextPostResponse.results[0] || null

  const post = {
    uid: postResponse.uid,
    first_publication_date: postResponse.first_publication_date,
    last_publication_date: postResponse.last_publication_date,
    data: {
      title: postResponse.data.title,
      subtitle: postResponse.data.subtitle,
      author: postResponse.data.author,
      banner: {
        url: postResponse.data.banner.url,
      },
      content: postResponse.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body,]
        }
      })
    }
  }

  return {
    props: {
      post,
      prevPost,
      nextPost,
      preview,
    },
    revalidate: 60 * 60,  // 1h
  }
};
