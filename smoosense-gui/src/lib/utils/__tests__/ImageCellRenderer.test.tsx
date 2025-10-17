import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import ImageCellRenderer from '../cellRenderers/ImageCellRenderer'
import { createTestStore } from '@/lib/test-utils'
import type { DeepPartial } from '@/lib/test-utils'
import type { RootState } from '@/lib/store'

const renderWithProvider = (component: React.ReactElement, stateOverrides?: DeepPartial<RootState>) => {
  const store = createTestStore(stateOverrides)
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  )
}

describe('ImageCellRenderer', () => {
  describe('Empty or invalid values', () => {
    it('should render "No image" for null value', () => {
      renderWithProvider(<ImageCellRenderer value={null} />)
      expect(screen.getByText('No image')).toBeInTheDocument()
    })

    it('should render "No image" for undefined value', () => {
      renderWithProvider(<ImageCellRenderer value={undefined} />)
      expect(screen.getByText('No image')).toBeInTheDocument()
    })

    it('should render "No image" for empty string', () => {
      renderWithProvider(<ImageCellRenderer value="" />)
      expect(screen.getByText('No image')).toBeInTheDocument()
    })

    it('should render "No image" for whitespace-only string', () => {
      renderWithProvider(<ImageCellRenderer value="   " />)
      expect(screen.getByText('No image')).toBeInTheDocument()
    })


    it('should render image for string with content after trimming', () => {
      renderWithProvider(<ImageCellRenderer value="  https://example.com/image.jpg  " />)
      const img = screen.getByRole('img', { name: 'Image' })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
    })
  })

  describe('Valid image URLs', () => {
    it('should render image element for valid HTTP URL', () => {
      renderWithProvider(<ImageCellRenderer value="http://example.com/image.jpg" />)
      const img = screen.getByRole('img', { name: 'Image' })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'http://example.com/image.jpg')
    })

    it('should render image element for valid HTTPS URL', () => {
      renderWithProvider(<ImageCellRenderer value="https://example.com/image.png" />)
      const img = screen.getByRole('img', { name: 'Image' })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/image.png')
    })

    it('should render image element for data URL', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      renderWithProvider(<ImageCellRenderer value={dataUrl} />)
      const img = screen.getByRole('img', { name: 'Image' })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', dataUrl)
    })
  })

  describe('Proxied URLs', () => {
    it('should use proxied URL for S3 image URLs', () => {
      const s3Url = 's3://bucket/image.jpg'
      const expectedProxiedUrl = './api/s3-proxy?url=' + encodeURIComponent(s3Url)
      renderWithProvider(<ImageCellRenderer value={s3Url} />)
      const img = screen.getByRole('img', { name: 'Image' })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', expectedProxiedUrl)
    })

    it('should use proxied URL for FTP image URLs', () => {
      const ftpUrl = 'ftp://server/image.png'
      const expectedProxiedUrl = './api/s3-proxy?url=' + encodeURIComponent(ftpUrl)
      renderWithProvider(<ImageCellRenderer value={ftpUrl} />)
      const img = screen.getByRole('img', { name: 'Image' })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', expectedProxiedUrl)
    })

    it('should use proxied URL for file:// URLs', () => {
      const fileUrl = 'file:///local/image.gif'
      const expectedProxiedUrl = './api/s3-proxy?url=' + encodeURIComponent(fileUrl)
      renderWithProvider(<ImageCellRenderer value={fileUrl} />)
      const img = screen.getByRole('img', { name: 'Image' })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', expectedProxiedUrl)
    })

    it('should NOT proxy HTTP URLs', () => {
      const httpUrl = 'http://example.com/image.jpg'
      renderWithProvider(<ImageCellRenderer value={httpUrl} />)
      const img = screen.getByRole('img', { name: 'Image' })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', httpUrl)
    })

    it('should NOT proxy HTTPS URLs', () => {
      const httpsUrl = 'https://example.com/image.jpg'
      renderWithProvider(<ImageCellRenderer value={httpsUrl} />)
      const img = screen.getByRole('img', { name: 'Image' })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', httpsUrl)
    })

    it('should properly encode URLs with special characters for proxy', () => {
      const s3UrlWithSpaces = 's3://bucket/path with spaces/image.jpg'
      const expectedProxiedUrl = './api/s3-proxy?url=' + encodeURIComponent(s3UrlWithSpaces)
      renderWithProvider(<ImageCellRenderer value={s3UrlWithSpaces} />)
      const img = screen.getByRole('img', { name: 'Image' })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', expectedProxiedUrl)
    })
  })

})