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

interface Post {
  uid?: string;
  first_publication_date: string | null;
  title: string;
  subtitle: string;
  author: string;
  next_page: string;
}

interface HomeProps {
  data: {
    results: Post[];
    next_page: string
  };
}

// interface HomeProps {
//   postsPagination: PostPagination;
// }

const prismic = getPrismicClient();

export default function Home({ data }: HomeProps) {
  const [posts, setPost] = useState<Post[]>(data.results);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState(data.next_page);

  async function handleNextPage() {
    const postResult = await fetch(`${nextPage}`)
    .then(response => response.json());
  
    setNextPage(postResult.next_page);
    setCurrentPage(postResult.page);

    const newPosts = postResult.results.map(post => {
      return {
        uid: post.uid,
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
        first_publication_date: format(
          new Date(post.first_publication_date),
          "dd MMM yyyy",
          {
            locale: ptBR,
          }
        ),
      }
    })
    console.log(newPosts);

    setPost([
      ...posts, ...newPosts
    ])
  }

  return (
    <>
      <Head>
        <title>spacetraveling</title>
      </Head>

      <main className={styles.container}>  
        <div className={styles.posts}>
          {data.results.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a className={styles.post}>
                <h1>{post.title}</h1>
                <span>{post.subtitle}</span>
                <div className={styles.footer}>
                    <FiCalendar className={styles.calendar} />
                    <time>{post.first_publication_date}</time>
  
                    <FiUser className={styles.hero}/>
                    <p>{post.author}</p>
                </div>
              </a>
            </Link>
          ))}

          <button type="button" onClick={handleNextPage}>Carregar mais posts</button>
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  // const prismic = getPrismicClient();
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
