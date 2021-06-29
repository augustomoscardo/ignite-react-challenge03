import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

import Prismic from '@prismicio/client'
import { getPrismicClient } from '../../services/prismic';

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
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  return (
    <>
      <Head>
        <title>spacetraveling</title>
      </Head>

      <main className={commonStyles.container}>
        <img src="" alt="" />
        <article className={styles.post}>
          
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
  const { uid } = params;

  const prismic = getPrismicClient();
  const postResponse = await prismic.getByUID('post', String(uid), {});
console.log(postResponse);

  const data = {
    uid: postResponse.uid,
    title: postResponse.data.title,
    author: postResponse.data.author,
    // banner: postResponse.data.banner,
    // heading: postResponse.data.heading,
    // body: postResponse.data.body,
    first_publication_date: postResponse.first_publication_date,
    last_publication_date: postResponse.last_publication_date
  }

  return {
    props: {
      data
    },
    revalidate: 60 * 30
  }
};
