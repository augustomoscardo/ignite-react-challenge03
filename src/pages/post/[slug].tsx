import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import Prismic from '@prismicio/client'
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';

import { formatDate } from '../../utils'

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
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
}

export default function Post({ post }: PostProps) {
  // const postBody = post.data.content.map(content => content.body.map(body => body.text))
  //   console.log(postBody);
    
  // // const bodyText = postBody.map(item => item)

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

    return <div>Carregando...</div>
  }

  return (
    <>
      <Head>
        <title>spacetraveling</title>
      </Head>

      <img src={post.data.banner.url} alt="banner" className={styles.banner} />

      <main className={commonStyles.container}>
        <article className={styles.post}>
          <div className={styles.header}>
            <h1>{post.data.title}</h1>
            <div className={styles.postInfo}>
              <div>
                <FiCalendar size={20} />
                <p>{formatDate(post.first_publication_date)}</p>
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
          </div>
            {post.data.content.map(content => (
              <div className={styles.postContent} key={content.heading}>
              
                <h2>{content.heading}</h2>
                
                {content.body.map(body => (

                <div dangerouslySetInnerHTML={{ __html: RichText.asText(body.text) }} key={body.text} />
                ))}               
              
              </div>
            ))}
        </article>
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

export const getStaticProps: GetStaticProps = async ({params}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const postResponse = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: postResponse.uid,
    first_publication_date: postResponse.first_publication_date,
    last_publication_date: postResponse.last_publication_date,
    data: {
      title: postResponse.data.title,
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
      post
    },
    revalidate: 60 * 30
  }
};
