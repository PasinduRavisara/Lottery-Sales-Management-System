import React, { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import { Camera, Save, X, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import "react-image-crop/dist/ReactCrop.css";

interface ProfilePictureUploadProps {
  onUploadSuccess: (newPictureUrl: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  onUploadSuccess,
  isOpen,
  onClose,
}) => {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isUploading, setIsUploading] = useState(false);
  const [cropSize, setCropSize] = useState({ width: 300, height: 300 });

  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImgSrc(reader.result?.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = useCallback(() => {
    setCrop({
      unit: "%",
      width: 90,
      height: 90,
      x: 5,
      y: 5,
    });
  }, []);

  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("No 2d context");
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = cropSize.width;
      canvas.height = cropSize.height;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        cropSize.width,
        cropSize.height
      );

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            }
          },
          "image/jpeg",
          0.9
        );
      });
    },
    [cropSize]
  );

  const handleUpload = useCallback(async () => {
    if (!imgRef.current || !completedCrop) {
      toast.error("Please select and crop an image first");
      return;
    }

    try {
      setIsUploading(true);

      const croppedImageBlob = await getCroppedImg(
        imgRef.current,
        completedCrop
      );

      const formData = new FormData();
      formData.append("profilePicture", croppedImageBlob, "profile.jpg");
      formData.append("width", cropSize.width.toString());
      formData.append("height", cropSize.height.toString());

      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/upload-profile-picture", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Profile picture updated successfully!");
        onUploadSuccess(data.profilePictureUrl);
        handleClose();
        // Refresh the page to update all profile picture displays
        setTimeout(() => {
          window.location.reload();
        }, 1000); // Wait 1 second to show the success toast
      } else {
        toast.error(data.message || "Failed to upload profile picture");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An error occurred while uploading");
    } finally {
      setIsUploading(false);
    }
  }, [completedCrop, getCroppedImg, cropSize, onUploadSuccess]);

  const handleClose = () => {
    setImgSrc("");
    setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
    setCompletedCrop(undefined);
    onClose();
  };

  const handleReset = () => {
    setImgSrc("");
    setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
    setCompletedCrop(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Upload Profile Picture
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {!imgSrc && (
            <div className="mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onSelectFile}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors flex flex-col items-center space-y-4"
              >
                <Camera size={48} className="text-gray-400" />
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-600">
                    Choose a photo
                  </p>
                  <p className="text-sm text-gray-500">
                    Upload a new profile picture
                  </p>
                </div>
              </button>
            </div>
          )}

          {imgSrc && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800">
                  Crop your image
                </h3>
                <button
                  onClick={handleReset}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RotateCcw size={16} />
                  <span>Reset</span>
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Size
                </label>
                <div className="flex space-x-4">
                  <div>
                    <label className="block text-xs text-gray-500">Width</label>
                    <input
                      type="number"
                      value={cropSize.width}
                      onChange={(e) =>
                        setCropSize((prev) => ({
                          ...prev,
                          width: parseInt(e.target.value) || 300,
                        }))
                      }
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      min="50"
                      max="800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">
                      Height
                    </label>
                    <input
                      type="number"
                      value={cropSize.height}
                      onChange={(e) =>
                        setCropSize((prev) => ({
                          ...prev,
                          height: parseInt(e.target.value) || 300,
                        }))
                      }
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      min="50"
                      max="800"
                    />
                  </div>
                  <button
                    onClick={() => setCropSize({ width: 300, height: 300 })}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Square
                  </button>
                </div>
              </div>

              <div className="relative">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={cropSize.width / cropSize.height}
                  className="max-w-full"
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    onLoad={onImageLoad}
                    className="max-w-full h-auto"
                  />
                </ReactCrop>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !completedCrop}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfilePictureUpload;
