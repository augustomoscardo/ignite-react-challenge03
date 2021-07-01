import { useState } from 'react';

import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link'

import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client'
import { getPrismicClient } from '../services/prismic';

import { formatDate } from '../utils'

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  title: string;
  subtitle: string;
  author: string;
}

interface HomeProps {
  data: {
    results: Post[];
    next_page: string
  };
}

export default function Home({ data }: HomeProps) {
  const formatPostDate = data.results.map(post => {
    return {
      ...post,
      first_publication_date: formatDate(post.first_publication_date)
    }
  });

  const [posts, setPosts] = useState<Post[]>(formatPostDate);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState(data.next_page);

  async function handleNextPage(): Promise<void> {
    if (currentPage !== 1 && nextPage === null) {
      return;
    }

    const postResult = await fetch(nextPage)
    .then(response => response.json());
  
    setNextPage(postResult.next_page);
    setCurrentPage(postResult.page);

    const newPosts = postResult.results.map((post: any) => {
      return {
        uid: post.uid,
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
        first_publication_date: formatDate(post.first_publication_date),
      }
    })
    console.log(newPosts);

    setPosts([
      ...posts, ...newPosts
    ])
  }

  return (
    <>
      <Head>
        <title>spacetraveling</title>
      </Head>

      <main className={commonStyles.container}>  
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a className={styles.post}>
                <h1>{post.title}</h1>
                <span>{post.subtitle}</span>
                <div className={styles.footer}>
                    <FiCalendar size={20} />
                    <time>{post.first_publication_date}</time>
  
                    <FiUser size={20} />
                    <p>{post.author}</p>
                </div>
              </a>
            </Link>
          ))}

          {nextPage && (
            <button type="button" onClick={handleNextPage}>Carregar mais posts</button>
          )}
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 2,
  });

  const data = {
    ...postsResponse,
    results: postsResponse.results.map(post => {
      return {
        uid: post.uid,
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
        first_publication_date: post.first_publication_date
      }
    }),
    next_page: postsResponse.next_page,
  }

  return {
    props: {
      data,
      revalidate: 60 * 60 * 24,  // 24 hours
    }
  }
};
