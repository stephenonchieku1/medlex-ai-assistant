import { useDropzone } from "react-dropzone";
import { Camera, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ImageUploadProps {
  onImageCapture: (file: File) => Promise<void>;
  isAnalyzing: boolean;
}

export default function ImageUpload({
  onImageCapture,
  isAnalyzing,
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setError(null);
        try {
          await onImageCapture(acceptedFiles[0]);
          toast.success("Image successfully uploaded");
        } catch (err) {
          toast.error("Failed to process image");
        }
      }
    },
    onDropRejected: () => {
      setError("Please upload a valid image file (PNG, JPG, or JPEG)");
      toast.error("Invalid file type");
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`flex-1 cursor-pointer ${
        isDragActive ? "bg-blue-700" : "bg-blue-500"
      } 
      text-white p-3 rounded-lg flex items-center justify-center space-x-4
      hover:bg-[#C62E2E] transition-colors relative`}
    >
      <input {...getInputProps()} />
      {isAnalyzing ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <Camera className="h-6 w-6" />
      )}
      <span>
        {isDragActive
          ? "Drop the image here"
          : isAnalyzing
          ? "Analyzing..."
          : "Scan Medicine"}
      </span>
      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white p-2 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}

// import { Camera, Loader2, X } from "lucide-react";
// import { useState, useRef } from "react";
// import { toast } from "sonner";

// interface ImageUploadProps {
//   onImageCapture: (file: File) => Promise<void>;
//   isAnalyzing: boolean;
// }

// export default function ImageUpload({
//   onImageCapture,
//   isAnalyzing,
// }: ImageUploadProps) {
//   const [error, setError] = useState<string | null>(null);
//   const [preview, setPreview] = useState<string | null>(null);
//   const [isDragActive, setIsDragActive] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const files = event.target.files;
//     if (files && files.length > 0) {
//       await processFile(files[0]);
//     }
//   };

//   const processFile = async (file: File) => {
//     // Check file type
//     if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
//       setError("Please upload a valid image file (PNG, JPG, or JPEG)");
//       toast.error("Invalid file type");
//       return;
//     }

//     setError(null);
//     try {
//       // Create preview URL for the image
//       const imageUrl = URL.createObjectURL(file);
//       setPreview(imageUrl);
      
//       await onImageCapture(file);
//       toast.success("Image successfully uploaded");
//     } catch (err) {
//       toast.error("Failed to process image");
//     }
//   };

//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragActive(true);
//   };

//   const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragActive(false);
//   };

//   const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragActive(false);
    
//     const files = e.dataTransfer.files;
//     if (files && files.length > 0) {
//       await processFile(files[0]);
//     }
//   };

//   const clearImage = () => {
//     if (preview) {
//       URL.revokeObjectURL(preview);
//     }
//     setPreview(null);
    
//     // Clear the file input
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   const handleClick = () => {
//     if (fileInputRef.current) {
//       fileInputRef.current.click();
//     }
//   };

//   return (
//     <div className="flex flex-col space-y-4">
//       {/* Image Preview Container */}
//       {preview && (
//         <div className="border-2 border-emerald-500 rounded-lg p-3 bg-white">
//           <div className="flex justify-between items-center mb-2">
//             <h3 className="font-medium text-gray-700">Image Preview</h3>
//             <button
//               onClick={clearImage}
//               className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 flex items-center justify-center"
//             >
//               <X className="h-4 w-4" />
//             </button>
//           </div>
//           <div className="flex items-center justify-center bg-gray-100 rounded p-2">
//             <img 
//               src={preview} 
//               alt="Medicine preview" 
//               className="max-h-64 max-w-full object-contain rounded"
//             />
//           </div>
//         </div>
//       )}
      
//       {/* Upload Container */}
//       <div
//         onClick={handleClick}
//         onDragOver={handleDragOver}
//         onDragLeave={handleDragLeave}
//         onDrop={handleDrop}
//         className={`cursor-pointer ${
//           isDragActive ? "bg-emerald-100" : "bg-emerald-500"
//         } text-white p-3 rounded-lg flex items-center justify-center space-x-2
//         hover:bg-emerald-600 transition-colors relative`}
//       >
//         <input 
//           ref={fileInputRef}
//           type="file"
//           className="hidden"
//           accept=".jpg,.jpeg,.png"
//           onChange={handleFileChange}
//         />
//         {isAnalyzing ? (
//           <Loader2 className="h-6 w-6 animate-spin" />
//         ) : (
//           <Camera className="h-6 w-6" />
//         )}
//         <span>
//           {isDragActive
//             ? "Drop the image here"
//             : isAnalyzing
//             ? "Analyzing..."
//             : preview
//             ? "Upload Different Image"
//             : "Scan Medicine"}
//         </span>
//         {error && (
//           <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white p-2 text-sm text-center">
//             {error}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }