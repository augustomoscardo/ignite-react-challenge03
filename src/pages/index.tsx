import { useState } from 'react';

import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link'

import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

import Prismic from '@prismicio/client'
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { ExitPreviewButton } from '../components/ExitPreviewButton';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {

  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleNewPosts(): Promise<void> {
    if (currentPage !== 1 && nextPage === null) {
      return;
    }

    const postsResult = await fetch(nextPage).then(response => response.json());

    setNextPage(postsResult.next_page);
    setCurrentPage(postsResult.page);

    const newPosts = postsResult.results.map((post: Post) => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      }
    })

    setPosts([...posts, ...newPosts]);
  }
console.log(preview);

  return (
    <>
      <Head>
        <title>spacetraveling | Home</title>
      </Head>

      <main className={commonStyles.container}>  
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a className={styles.post}>
                <h1>{post.data.title}</h1>
                <span>{post.data.subtitle}</span>
                <div className={styles.footer}>
                    <FiCalendar size={20} />
                    <time>{format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy', {
                      locale: ptBR,
                      })}
                    </time>
  
                    <FiUser size={20} />
                    <p>{post.data.author}</p>
                </div>
              </a>
            </Link>
          ))}

          {nextPage && (
            <button type="button" onClick={handleNewPosts}>
              Carregar mais posts
            </button>
          )}

          {preview && (
            <ExitPreviewButton />
          )}
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({preview = false, previewData}) => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 2,
    orderings: '[document.first_publication_date desc]',
    ref: previewData?.ref ?? null
  });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    results: posts,
    next_page: postsResponse.next_page,
  };

  return {
    props: {
      postsPagination,
      revalidate: 60 * 60 * 24,  // 24 hours
      preview
    },
  }
};
