/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import { useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import useStyles from './styles';
import { schemaCadastrarProdutos } from '../../validacoes/schema';
import './styles.css';
import AuthContext from '../../context/AuthContext';
import useAuth from '../../hooks/useAuth';

import '../../styles/global.css';
import fotoProduto from '../../assets/foto-produto.svg';
import uploadIcon from '../../assets/upload-icon.svg';
import {
  postAutenticado, postNaoAutenticado, put
} from '../../services/apiClient';

export default function ProdutosEditar({
  id: idProduto,
  nome,
  descricao,
  preco,
  ativo,
  permiteObservacoes,
  recarregarPag,
  imagem_produto: temImagem
}) {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [erro, setErro] = useState('');
  const { token } = useContext(AuthContext);
  const { user } = useAuth();
  const customId = 'custom-id-yes';
  const {
    register, handleSubmit, formState: { errors }
  } = useForm({
    resolver: yupResolver(schemaCadastrarProdutos)
  });
  const [carregando, setCarregando] = useState(false);
  const [urlImagem, setUrlImagem] = useState('');
  const [baseImage, setBaseImage] = useState('');

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function stop(e) {
    e.stopPropagation();
  }

  async function onSubmit(data) {
    setCarregando(true);
    setErro('');

    const todosDados = { ...data, imagemProduto: urlImagem };

    const { ativo: ativou, ...dadosAtualizados } = Object
      .fromEntries(Object
        .entries(todosDados)
        .filter(([, value]) => value));

    try {
      const { dados, ok } = await put(`/produtos/${idProduto}`, dadosAtualizados, token);

      if (!ok) {
        setErro(dados);
        toast.error(erro.message, { toastId: customId });
        return;
      }

      if (!ativou) {
        const ativado = await postAutenticado(`/produtos/${idProduto}/desativar`, false, token);
        toast.warn('O produto foi desativado', { toastId: customId });
        return;
      }
      if (ativou) {
        const ativado = await postAutenticado(`/produtos/${idProduto}/ativar`, true, token);
        toast.warn('O produto foi ativado!', { toastId: customId });
        return;
      }

      setCarregando(false);
      return;
    } catch (error) {
      setErro(error.message);
    }

    toast.success('O produto foi atualizado com sucesso!', { toastId: customId });
    handleClose();
    recarregarPag();
  }

  const convertBase64 = (file) => new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);

    fileReader.onload = () => {
      resolve(fileReader.result);
    };

    fileReader.onerror = (error) => {
      reject(error);
    };
  });

  async function uploadImagem(e) {
    setCarregando(true);
    const { ID } = user;
    const file = e.target.files[0];
    const base64 = await convertBase64(file);
    setBaseImage(base64);

    const imagemFoto = { imagem: `${ID}/${idProduto}/${Date.now()}.jpg` };

    const temFoto = await postNaoAutenticado('/imagem', imagemFoto);

    if (temFoto) {
      await postNaoAutenticado('/delete', imagemFoto);
    }

    const data = {
      nome: `${ID}/${idProduto}/${Date.now()}.jpg`,
      imagem: `${base64.split(',')[1]}`
    };
    const { dados, ok } = await postNaoAutenticado('/upload', data);

    if (!ok) {
      return toast.error(dados, { toastId: customId });
    }
    setUrlImagem(dados);
    setCarregando(false);
    return toast.success('A imagem foi alterada', { toastId: customId });
  }

  toast.error(errors.nome?.message, { toastId: customId });
  toast.error(errors.descricao?.message, { toastId: customId });
  toast.error(errors.preco?.message, { toastId: customId });

  return (
    <div onClick={(e) => stop(e)} className={classes.container}>
      <button type="button" className="btTransparente" onClick={handleClickOpen}>Editar produto</button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <div className="flexColumn">
          <div className="formProdutos flexRow gap3rem px2rem">
            <form onSubmit={handleSubmit(onSubmit)}>
              <h1>Editar produto</h1>
              <div className="flexColunm mb1rem ">
                <label htmlFor="nomeRestaurante">Nome</label>
                <input
                  id="nomeRestaurante"
                  type="text"
                  defaultValue={nome}
                  {...register('nome')}
                />
              </div>
              <div className="flexColunm mb1rem ">
                <label htmlFor="descricao">Descrição</label>
                <input
                  id="descricao"
                  type="text-field"
                  defaultValue={descricao}
                  {...register('descricao')}
                />
                <span className="mr06rem">Máx.: 50 caracteres</span>
              </div>
              <div className="flexColunm mb1rem ">
                <label htmlFor="valor">Valor</label>
                <input
                  id="valor"
                  type="number"
                  placeholder="00,00"
                  defaultValue={preco}
                  {...register('preco')}
                />
              </div>
              <actions className="ativarProdutos">
                <section>
                  <label className="switch">
                    <input type="checkbox" defaultChecked={ativo} {...register('ativo')} />
                    <span className="slider round" />
                    <span>ON</span>
                  </label>
                  <span className="ml1rem">Ativar produto</span>
                </section>

                <section>
                  <label className="switch">
                    <input type="checkbox" {...register('permiteObservacoes')} defaultChecked={permiteObservacoes} />
                    <span className="slider round" />
                    <span>ON</span>
                  </label>
                  <span className="ml1rem">Permitir observações</span>
                </section>
              </actions>
            </form>
            <div className="fotoProdutosNovo posRelative">

              { temImagem
                ? (<img src={temImagem} alt="foto do produto" id="fotoCarregada" />)
                : (<img src={fotoProduto} alt="foto do produto" />)}
              <label htmlFor="fileNew" className="fileNew" />
              <input
                type="file"
                id="fileNew"
                name="file"
                onChange={(e) => uploadImagem(e)}
              />
              <img className="iconeUpload" src={uploadIcon} alt="icone de upload de foto" />

              <label htmlFor="iconeUpload" className="labelIconeUpload">
                Clique
                para adicionar uma imagem
              </label>
            </div>
          </div>
        </div>
        <DialogActions className={classes.botoes}>
          <button className="btTransparente" type="button" onClick={handleClose}>
            Cancelar
          </button>
          <button className="btLaranja" type="submit" onClick={handleSubmit(onSubmit)}>
            Salvar alterações
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
